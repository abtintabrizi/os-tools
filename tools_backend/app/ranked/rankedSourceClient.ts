import { setTimeout as sleep } from "node:timers/promises";

import { LoggerManager } from "../managers/loggerManager.js";

const logger = new LoggerManager("rankedCollector");

const SOURCE_HEADERS = {
  accept: "text/html,application/xhtml+xml",
  "user-agent": "Mozilla/5.0 (compatible; OS-Tools-Ranked-Collector/1.0)",
};

const MAX_RETRY_WAIT_MS = 60_000;
const REQUEST_FAILURE_WINDOW = 20;
const MIN_REQUESTS_FOR_FAILURE_CHECK = 10;
const MAX_REQUEST_FAILURE_RATE = 0.3;

export const REQUEST_SPACING_MS = 1000;

export type RankedSourceClient = (url: string) => Promise<string>;

export class SourcePausedError extends Error {}

function retryDelay(response: Response): number {
  const header = response.headers.get("retry-after");
  if (!header) {
    return 0;
  }

  if (/^\d+$/u.test(header)) {
    return Number(header) * 1000;
  }

  return Math.max(0, Date.parse(header) - Date.now()) || 0;
}

export function createRankedSourceClient(runSignal: AbortSignal): RankedSourceClient {
  const pause = new AbortController();
  const signal = AbortSignal.any([runSignal, pause.signal]);
  const recentOutcomes: boolean[] = [];
  let nextRequestAt = 0;
  let startQueue = Promise.resolve();

  function stopSource(message: string): never {
    const error = new SourcePausedError(message);
    pause.abort(error);

    throw error;
  }

  function recordOutcome(succeeded: boolean): void {
    signal.throwIfAborted();
    recentOutcomes.push(succeeded);
    if (recentOutcomes.length > REQUEST_FAILURE_WINDOW) {
      recentOutcomes.shift();
    }

    const requests = recentOutcomes.length;
    if (requests < MIN_REQUESTS_FOR_FAILURE_CHECK) {
      return;
    }

    const failures = recentOutcomes.filter((outcome) => {
      return !outcome;
    }).length;
    if (failures / requests > MAX_REQUEST_FAILURE_RATE) {
      stopSource(
        `Stats site request failure rate exceeded ${MAX_REQUEST_FAILURE_RATE * 100}% (${failures}/${requests})`,
      );
    }
  }

  async function getHtml(url: string): Promise<string> {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const start = startQueue.then(async () => {
        while (nextRequestAt > performance.now()) {
          await sleep(Math.ceil(nextRequestAt - performance.now()), undefined, { signal });
        }
        signal.throwIfAborted();
        nextRequestAt = performance.now() + REQUEST_SPACING_MS;
      });
      startQueue = start.catch(() => {
        // The requesting worker handles the error below. Later workers check the shared signal.
      });

      try {
        await start;
      } catch (error) {
        signal.throwIfAborted();
        throw error;
      }
      signal.throwIfAborted();

      let response: Response;
      let html: string | undefined;

      try {
        response = await fetch(url, {
          headers: SOURCE_HEADERS,
          redirect: "manual",
          signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
        });
        if (response.ok && response.headers.get("content-type")?.toLowerCase().startsWith("text/html")) {
          html = await response.text();
        }
      } catch (error) {
        recordOutcome(false);
        if (attempt === 3) {
          throw error;
        }

        const retryInMs = attempt * 1000;
        logger.warn("Retrying stats request", { url, attempt, retryInMs, error });
        nextRequestAt = Math.max(nextRequestAt, performance.now() + retryInMs);

        continue;
      }

      if (html !== undefined) {
        recordOutcome(true);

        return html;
      }

      await response.body?.cancel();
      recordOutcome(false);
      if (response.ok) {
        throw new Error("Expected HTML from the stats site");
      }

      const wait = retryDelay(response);
      if (wait > MAX_RETRY_WAIT_MS || (response.status === 429 && attempt === 3)) {
        stopSource(`Stats site requested a pause (HTTP ${response.status})`);
      }

      const retry = attempt < 3 && [408, 429, 500, 502, 503, 504].includes(response.status);
      const retryInMs = retry ? Math.max(wait, attempt * 1000) : wait;
      if (retryInMs) {
        nextRequestAt = Math.max(nextRequestAt, performance.now() + retryInMs);
      }

      if (!retry) {
        throw new Error(`Unexpected stats site response (HTTP ${response.status})`);
      }

      logger.warn("Retrying stats request", { url, attempt, status: response.status, retryInMs });
    }

    throw new Error("Stats site request attempts exhausted");
  }

  return getHtml;
}
