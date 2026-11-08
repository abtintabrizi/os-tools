import { randomUUID } from "node:crypto";
import { open, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";

import { LoggerManager } from "../managers/loggerManager.js";
import {
  parseLeaderboard,
  parseProfile,
  type RankedMatch,
  type RankedPlayerSnapshot,
  type RankedProfile,
  STATS_ORIGIN,
} from "./rankedSource.js";
import {
  createRankedSourceClient,
  type RankedSourceClient,
  REQUEST_SPACING_MS,
  SourcePausedError,
} from "./rankedSourceClient.js";

const logger = new LoggerManager("rankedCollector");

const MAX_BATCH_SIZE = 50;
const MAX_CONCURRENT_REQUESTS = 5;

interface RankedBatch {
  matches: RankedMatch[];
  playerSnapshot: RankedPlayerSnapshot | null;
}

interface CrawlProgress {
  profiles: number;
  leaderboardFailures: number;
  duplicateProfiles: number;
  attemptedProfiles: number;
  cards: number;
  profileFailures: number;
  profilesWithoutSnapshot: number;
  skippedCards: number;
  sourcePaused: boolean;
}

interface ProfileBatch {
  batch: RankedBatch;
  profile: RankedProfile;
  url: string;
}

interface BatchResult {
  inserted: number;
  existing: number;
  rejected: { fingerprint: string | null; reason: string }[];
}

type ReportFailure = (message: string, fields: Record<string, unknown>, level?: "WARNING" | "ERROR") => Promise<void>;

async function* getProfiles(
  getHtml: RankedSourceClient,
  pages: number,
  progress: CrawlProgress,
  reportFailure: ReportFailure,
  signal: AbortSignal,
): AsyncGenerator<RankedProfile, void> {
  const ranksByUrl = new Map<string, number>();

  for (let page = 1; page <= pages && !progress.sourcePaused && !signal.aborted; page += 1) {
    const url = `${STATS_ORIGIN}/leaderboards${page === 1 ? "" : `?page=${page}`}`;
    logger.info("Reading ranked leaderboard page", { page, pages, url });

    let rows: RankedProfile[];

    try {
      rows = parseLeaderboard(await getHtml(url), url);
    } catch (error) {
      if (signal.aborted) {
        return;
      }

      if (error instanceof SourcePausedError) {
        throw error;
      }

      progress.leaderboardFailures += 1;
      await reportFailure("Leaderboard page failed", { page, url, error });

      continue;
    }

    const profiles: RankedProfile[] = [];
    for (const profile of rows) {
      const firstRank = ranksByUrl.get(profile.url);

      if (firstRank !== undefined) {
        progress.duplicateProfiles += 1;
        await reportFailure("Skipped duplicate ranked profile", {
          page,
          player: profile.name,
          rank: profile.rank,
          firstRank,
          url: profile.url,
        });

        continue;
      }

      ranksByUrl.set(profile.url, profile.rank);
      profiles.push(profile);
    }

    progress.profiles = ranksByUrl.size;
    logger.info("Ranked leaderboard checkpoint", {
      page,
      pages,
      collectedProfiles: progress.profiles,
      duplicateProfiles: progress.duplicateProfiles,
    });

    yield* profiles;
  }

  if (!progress.profiles && !progress.sourcePaused && !signal.aborted) {
    throw new Error(`No ranked profiles collected from ${pages} leaderboard pages`);
  }
}

function createDatabaseClient(): SupabaseClient {
  config({ path: fileURLToPath(new URL("../../.env", import.meta.url)), quiet: true });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for writes");
  }

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function* collectProfileBatches(
  getHtml: RankedSourceClient,
  profiles: AsyncIterator<RankedProfile, void>,
  progress: CrawlProgress,
  reportFailure: ReportFailure,
  signal: AbortSignal,
): AsyncGenerator<ProfileBatch, void> {
  while (!progress.sourcePaused && !signal.aborted) {
    const next = await profiles.next();

    if (next.done || progress.sourcePaused || signal.aborted) {
      return;
    }

    const profile = next.value;
    const context = { rank: profile.rank, player: profile.name, profileUrl: profile.url };
    const startedAt = performance.now();
    let url: string | null = profile.url;
    let capturedSnapshot = false;
    let cards = 0;
    let matches = 0;
    let skippedCards = 0;
    const visited = new Set<string>();

    progress.attemptedProfiles += 1;
    logger.info("Scraping ranked player profile", context);

    try {
      while (url) {
        if (visited.has(url)) {
          throw new Error("Match history pagination repeated a page");
        }

        visited.add(url);
        if (visited.size > 1) {
          logger.info("Reading additional match history page", { ...context, url, page: visited.size });
        }

        const html = await getHtml(url);
        const page = parseProfile(html, url, new Date().toISOString());

        progress.cards += page.cards;
        progress.skippedCards += page.skipped.length;
        cards += page.cards;
        matches += page.matches.length;
        skippedCards += page.skipped.length;

        for (const skipped of page.skipped) {
          await reportFailure("Skipped ranked card", { ...context, url, ...skipped });
        }

        const snapshot = capturedSnapshot ? null : page.snapshot;
        if (snapshot) {
          capturedSnapshot = true;
        }
        if (snapshot || page.matches.length) {
          let offset = 0;
          do {
            yield {
              profile,
              url,
              batch: {
                matches: page.matches.slice(offset, offset + MAX_BATCH_SIZE),
                playerSnapshot: offset === 0 ? snapshot : null,
              },
            };
            offset += MAX_BATCH_SIZE;
          } while (offset < page.matches.length);
        }

        url = page.next;
      }

      if (!capturedSnapshot) {
        progress.profilesWithoutSnapshot += 1;
        await reportFailure("Profile has no verified player ID for a snapshot", context);
      }

      logger.info("Ranked profile checkpoint", {
        ...context,
        pages: visited.size,
        cards,
        matches,
        skippedCards,
        capturedSnapshot,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      if (signal.aborted) {
        return;
      }

      if (error instanceof SourcePausedError) {
        throw error;
      }

      progress.profileFailures += 1;
      await reportFailure("Profile collection failed", { ...context, url, error });
    }
  }
}

async function* collectBatches(pages: number, progress: CrawlProgress, reportFailure: ReportFailure) {
  const run = new AbortController();
  const getHtml = createRankedSourceClient(run.signal);
  const profiles = getProfiles(getHtml, pages, progress, reportFailure, run.signal);
  const workers = Array.from({ length: MAX_CONCURRENT_REQUESTS }, () => {
    return collectProfileBatches(getHtml, profiles, progress, reportFailure, run.signal);
  });

  function advance(worker: (typeof workers)[number]) {
    return worker.next().then(
      (result) => {
        return { worker, result };
      },
      (error: unknown) => {
        return { worker, error };
      },
    );
  }

  const pending = new Map(
    workers.map((worker) => {
      return [worker, advance(worker)] as const;
    }),
  );

  try {
    while (pending.size) {
      const next = await Promise.race(pending.values());
      pending.delete(next.worker);

      if ("error" in next) {
        throw next.error;
      }
      if (!next.result.done) {
        yield next.result.value;
        pending.set(next.worker, advance(next.worker));
      }
    }
  } catch (error) {
    if (!(error instanceof SourcePausedError)) {
      throw error;
    }

    progress.sourcePaused = true;
    await reportFailure("Stopped ranked collection after source failures", { error }, "ERROR");
  } finally {
    run.abort();
    await Promise.allSettled(
      workers.map((worker) => {
        return worker.return();
      }),
    );
    await profiles.return();
  }
}

async function persistBatch(client: SupabaseClient, batch: RankedBatch): Promise<BatchResult> {
  const { data, error } = await client.rpc("ingest_ranked_batch", {
    p_matches: batch.matches,
    p_snapshot: batch.playerSnapshot,
  });
  const result = data as BatchResult | null;

  if (
    error ||
    typeof result?.inserted !== "number" ||
    typeof result.existing !== "number" ||
    !Array.isArray(result.rejected)
  ) {
    throw new Error(`Ranked batch write failed (${error?.code || "unexpected result"})`);
  }

  return result;
}

async function runCollection(
  pages: number,
  dryRun: boolean,
  path: string | null,
  reportFailure: ReportFailure,
): Promise<void> {
  const startedAt = performance.now();
  const client = dryRun ? null : createDatabaseClient();

  const fingerprints = new Set<string>();
  const progress: CrawlProgress = {
    profiles: 0,
    leaderboardFailures: 0,
    duplicateProfiles: 0,
    attemptedProfiles: 0,
    cards: 0,
    profileFailures: 0,
    profilesWithoutSnapshot: 0,
    skippedCards: 0,
    sourcePaused: false,
  };
  const writes = { inserted: 0, existing: 0, writeFailures: 0 };
  let rankedSightings = 0;
  let missingIds = 0;
  let playerSnapshots = 0;
  let batchNumber = 0;

  const tempPath = path ? `${path}.${randomUUID()}.tmp` : null;
  let output = tempPath ? await open(tempPath, "wx") : null;
  let firstBatch = true;

  try {
    await output?.writeFile('{"batches":[');

    for await (const { batch, profile, url } of collectBatches(pages, progress, reportFailure)) {
      batchNumber += 1;
      const context = { batch: batchNumber, rank: profile.rank, player: profile.name, url };
      const sample = batch.matches[0];

      if (dryRun && !output && rankedSightings === 0 && sample) {
        logger.info("Sample ranked match", { match: sample });
      }

      for (const match of batch.matches) {
        fingerprints.add(match.fingerprint);
        for (const participant of match.participants) {
          if (!participant.player_id) {
            missingIds += 1;
          }
        }
      }
      rankedSightings += batch.matches.length;
      if (batch.playerSnapshot) {
        playerSnapshots += 1;
      }

      if (output) {
        await output.writeFile(`${firstBatch ? "" : ","}\n${JSON.stringify(batch, null, 2)}`);
        firstBatch = false;
      }

      let result: BatchResult | undefined;
      if (client) {
        try {
          result = await persistBatch(client, batch);
        } catch (error) {
          await reportFailure("Failed to write ranked batch", { ...context, error }, "ERROR");
          process.exitCode = 1;

          return;
        }

        writes.inserted += result.inserted;
        writes.existing += result.existing;
        writes.writeFailures += result.rejected.length;
        for (const rejected of result.rejected) {
          await reportFailure("Ranked match rejected", { ...context, ...rejected });
        }
      }

      logger.info("Ranked batch checkpoint", {
        ...context,
        matches: batch.matches.length,
        snapshot: batch.playerSnapshot !== null,
        rankedSightings,
        uniqueMatches: fingerprints.size,
        dryRun,
        ...(result && { inserted: result.inserted, existing: result.existing, rejected: result.rejected.length }),
      });
    }

    const summary = {
      dryRun,
      pages,
      ...progress,
      rankedSightings,
      uniqueMatches: fingerprints.size,
      duplicateSightings: rankedSightings - fingerprints.size,
      missingIds,
      playerSnapshots,
      elapsedMs: Math.round(performance.now() - startedAt),
    };

    if (output && path && tempPath) {
      await output.writeFile(`\n],"summary":${JSON.stringify(summary, null, 2)}}\n`);
      await output.close();
      output = null;
      await rename(tempPath, path);
      logger.info("Wrote ranked collection export", { path, sightings: rankedSightings });
    }
    logger.info("Ranked collection finished", { ...summary, ...writes });

    if (progress.sourcePaused || progress.profileFailures === progress.attemptedProfiles) {
      process.exitCode = 1;
    }
  } finally {
    await output?.close();
    if (tempPath) {
      await rm(tempPath, { force: true });
    }
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { "dry-run": { type: "boolean" }, pages: { type: "string", default: "4" }, output: { type: "string" } },
  });
  const pages = Number(values.pages);

  if (!/^\d+$/u.test(values.pages) || pages < 1 || pages > 400) {
    throw new Error("--pages must be an integer from 1 to 400");
  }
  if (values.output !== undefined && !values.output.trim()) {
    throw new Error("--output requires a file path");
  }

  const dryRun = values["dry-run"] ?? false;
  const cwd = process.env.INIT_CWD ?? process.cwd();
  const path = values.output ? resolve(cwd, values.output) : null;
  const failurePath = resolve(cwd, "ranked-collector-errors.jsonl");

  if (path?.toLowerCase() === failurePath.toLowerCase()) {
    throw new Error("--output must use a different path from the failure log");
  }

  const failureLog = await open(failurePath, "a");
  const runId = randomUUID();
  let failureWrites = Promise.resolve();

  const reportFailure: ReportFailure = (message, fields, level = "WARNING") => {
    logger[level === "ERROR" ? "error" : "warn"](message, fields);
    const entry = { timestamp: new Date().toISOString(), runId, level, message, ...fields };
    const line = JSON.stringify(entry, (_key, value: unknown) => {
      return value instanceof Error ? { name: value.name, message: value.message, stack: value.stack } : value;
    });
    failureWrites = failureWrites.then(() => {
      return failureLog.writeFile(`${line}\n`);
    });

    return failureWrites;
  };

  logger.info("Collecting ranked history", {
    pages,
    dryRun,
    runId,
    maxConcurrentRequests: MAX_CONCURRENT_REQUESTS,
    requestSpacingMs: REQUEST_SPACING_MS,
    failureLog: failurePath,
  });

  try {
    await runCollection(pages, dryRun, path, reportFailure);
  } catch (error) {
    await reportFailure("Ranked collection failed", { error }, "ERROR");
    process.exitCode = 1;
  } finally {
    await failureLog.close();
  }
}

void main().catch((error: unknown) => {
  logger.error("Ranked collection failed", { error });
  process.exitCode = 1;
});
