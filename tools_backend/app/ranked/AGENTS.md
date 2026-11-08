# Ranked match collector

Read the [repository guidance](../../../AGENTS.md) and [backend guidance](../../AGENTS.md) before
changing this directory. Keep the collector runnable as a standalone Node CLI. It fetches the
public [Omega Strikers stats site](https://stats.omegastrikers.gg/leaderboards) and writes directly to
Supabase. It runs independently of Express, draft rooms, and WebSockets.

## Local runs

From the repository root, use Node 24 and install the pinned workspace dependencies with
`pnpm install --frozen-lockfile`. Start with a dry run that streams the scraped data to a file.

```sh
pnpm --filter @os-tools/backend collect:ranked --dry-run --pages 1 --output ranked-matches.json
```

- `--pages` selects the first 1–400 leaderboard pages and defaults to 4. The number of distinct
  profiles depends on the rows the site returns.
- `--dry-run` skips loading Supabase credentials and creating a Supabase client. Without `--output`,
  it logs the first parsed match as a sample.
- `--output` writes a JSON object with a `batches` array and a final `summary`. Each batch contains
  `matches` and a nullable `playerSnapshot`. Repeat sightings are included so fingerprints can be
  compared. The collector streams to a temporary file and replaces the destination when the export
  finishes. Relative paths start from the directory where you launched the command.

For writes, apply the [ranked schema migration](../../../supabase/migrations/20261108014912_ranked_match_collection.sql)
once to the target Supabase project. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in
`tools_backend/.env` or in the process environment. Process values take precedence. Keep the key
in backend environment settings and out of source files and logs. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)

```sh
pnpm --filter @os-tools/backend collect:ranked --pages 1
```

Use `--pages 400` for the full leaderboard. Supabase writes are enabled when `--dry-run` is absent.

## Daily Render cron job

In Render, create a **Cron Job** from the branch containing the collector. Add `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` to the cron job's environment settings. Render can also share those
values with the web service through an environment group. [Render Cron Jobs](https://render.com/docs/cronjobs)

| Render setting | Value                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Name           | `ranked-match-collector`                                                                                   |
| Runtime        | Node 24 from `.node-version`                                                                               |
| Root Directory | Leave blank to use the repository root                                                                     |
| Build Command  | `corepack pnpm install --frozen-lockfile && corepack pnpm exec turbo run build --filter=@os-tools/backend` |
| Schedule       | `0 10,11 * * *`                                                                                            |

Use this **Command** to scrape all 400 pages at **6 a.m. Eastern local time**.

```sh
if [ "$(TZ=America/New_York date +%H)" = "06" ]; then
  exec node tools_backend/dist/ranked/collectRanked.js --pages 400
fi
```

Render schedules in UTC. The local-hour check selects 10:00 UTC during daylight time and 11:00 UTC
during standard time. For fixed 6 a.m. EST (UTC−05:00) year-round, use `0 11 * * *` and the `node`
command directly. [Render schedule documentation](https://render.com/docs/cronjobs#setup)

For the first hosted test, temporarily set the Command to
`node tools_backend/dist/ranked/collectRanked.js --pages 1` and use **Runs → Trigger Run**. Check
for `Ranked collection finished` in the run logs, then confirm that `ranked_matches` and
`ranked_player_snapshots` have the expected rows in Supabase. Restore the 400-page command after
the test. An unscheduled run of the command with the local-hour check skips collection outside
the 6 a.m. hour. Triggering a run while one is active cancels the active run.
[Render manual runs](https://render.com/docs/cronjobs#manually-triggering-a-run)

At one request start per second, 400 leaderboard pages plus 10,000 distinct profiles take about
2 hours and 53 minutes before history pagination, retries, or write delays. Render caps a run at
12 hours. Use the run logs to inspect checkpoints and warnings because the cron job's local files
are ephemeral. [Render run limits](https://render.com/docs/cronjobs#single-run-guarantee)

## Collection and failure handling

- [`collectRanked.ts`](collectRanked.ts) streams leaderboard entries into five profile workers.
  It deduplicates by published profile URL and logs the first and repeated ranks for a duplicate.
  A profile worker follows same-profile history links and rejects pagination loops.
- [`rankedSourceClient.ts`](rankedSourceClient.ts) shares a single request queue across leaderboard
  and profile fetches. It spaces request starts by at least one second and allows up to three
  attempts for transient failures. Preserve the shared pacing and `Retry-After` handling. A long
  `Retry-After` or a final HTTP 429 stops the crawl.
- [`rankedSource.ts`](rankedSource.ts) parses server-rendered HTML with Cheerio. It collects only
  `Ranked` cards with identifiable teams and complete character and goals/assists/saves/KOs data
  for all six slots. The profile owner's slot can also be identified from a `Normal` card to
  establish the snapshot's player ID. Coverage ends where the source's visible history ends.
- Keep writes sequential in batches of at most 50 matches plus an optional profile snapshot.
  Workers hold the current history page and yield batches as they are consumed. Across the run,
  retain the profile URL index for deduplication and match fingerprints for summary counts.
  Send repeat match sightings to Supabase so later profiles can supply missing IDs.

The collector logs profile rank, name, and URL, then checkpoints for leaderboard pages, profiles,
and batches. Skipped work goes to the console and `ranked-collector-errors.jsonl` in the launch
directory. Check `leaderboardFailures`, `profileFailures`, `profilesWithoutSnapshot`, `skippedCards`,
and `writeFailures` in the final log. Partial failures can exit successfully. A source pause,
no readable profiles, a failed batch RPC, or a fatal error exits nonzero. Previously committed
batches survive an interrupted run. A rerun starts from leaderboard page 1.

## Stored data and invariants

| Table                     | Contents                                                                                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ranked_matches`          | One row per fingerprint with map, duration in seconds, bans, average tier, source profile URL, observation time, estimated play time, and a `participants` JSONB array.                                        |
| `ranked_players`          | One row per verified source player ID.                                                                                                                                                                         |
| `ranked_player_snapshots` | One observation per player and observation time, with profile name, current LP (`rating`), and tier. Each scrape with a verified owner ID records a snapshot, including when values match the previous scrape. |

- Store the three winners first and the three losers second. Each participant has character,
  goals, assists, saves, KOs, MVP, role and level when available, gear, awakenings in source order,
  and a nullable `player_id`. Keep gear separate when the first loadout icon identifies known gear.
- Read IDs from `/get_username/<id>` links in roster slots. Match the profile owner's slot using
  its highlight or a unique character and stat line before attaching the name and rating.
  Leave unknown IDs null and keep name and rating observations in snapshots. For historical
  display, use the latest snapshot at or before `estimated_played_at`, when available.
- Derive `estimated_played_at` by subtracting the rounded age label from the UTC page observation
  time. Leave it null when the age cannot be parsed. The first available estimate is kept on repeat
  sightings. The source's card ID is local to the profile and the source provides no verified
  global match ID, exact match time, or region.
- The `v1:` fingerprint is a SHA-256 hash of the normalized map, duration in seconds, and sorted
  character and G/A/S/K tuples grouped by winning and losing teams. Preserve these inputs so the
  same match hashes identically across player views and renames.
- Write through `ingest_ranked_batch`, which validates matches and coordinates concurrent writes
  in Supabase. It reports individual rejected matches while committing valid entries in the batch.
  A repeat sighting can fill missing participant IDs, estimated play time, or average tier.
  Keep the stored gameplay and only enrich participant IDs when the slot can be identified
  unambiguously. Keep RLS enabled and the ingestion RPC restricted to the server-side role.

## Verifying changes

For selector or fingerprint changes, dry-run a small sample and compare it with the source.
Verify ranked filtering, loadout order, nullable IDs, and identical fingerprints for a shared match
seen from opposing profiles. For persistence changes, use a disposable Supabase project to check
repeated and concurrent ingestion, ID enrichment, and snapshot history. Confirm that expanding
`participants` with `jsonb_array_elements` yields six rows per match. Follow the backend guide for
formatting, lint, typecheck, and build after code changes.
