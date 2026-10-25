import { CURRENT_AWAKENING_POOL, AWAKENING_CONFLICTS } from "../constants/common.js";
import { STRIKER_POOL, STRIKER_SEQUENCE } from "../constants/strikerDraft.js";
import type { StrikerDraftState } from "../models/strikerDraft.js";
import type { PlayingSide } from "../models/common.js";
import { RequestError } from "./requestError.js";

export function getAvailableAwakenings(bannedStarts: readonly string[] | null, first?: string): string[] {
  const banned = bannedStarts ?? [];
  const firstPool = CURRENT_AWAKENING_POOL.filter((a) => !banned.includes(a));

  if (!firstPool.length) throw new RequestError(400, "No awakenings available: all are banned.");

  if (first === undefined) return firstPool;

  const conflicts = AWAKENING_CONFLICTS[first] ?? [];
  const available = firstPool.filter((a) => a !== first && !conflicts.includes(a));

  if (!available.length)
    throw new RequestError(400, `No compatible second awakening available after choosing '${first}'.`);

  return available;
}

export function applyStrikerAction(
  state: StrikerDraftState,
  striker: string | null,
): { state: StrikerDraftState; side: PlayingSide } {
  const entry = STRIKER_SEQUENCE[state.step];

  if (!entry) throw new RequestError(400, "No more steps remaining");

  if (striker === null) {
    if (entry.action !== "ban") throw new RequestError(400, "No-ban is only allowed on ban steps");
  } else {
    if (!STRIKER_POOL.includes(striker)) throw new RequestError(400, "Invalid striker");

    if (state.actions.some((a) => a.striker === striker)) throw new RequestError(400, "Striker already used");
  }

  const step = state.step + 1;

  return {
    state: {
      ...state,
      actions: [...state.actions, { striker, team: entry.team, step: state.step, action: entry.action }],
      step,
      done: step >= STRIKER_SEQUENCE.length,
    },
    side: entry.team,
  };
}
