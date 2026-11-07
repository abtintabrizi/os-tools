import {
  type Awakening,
  AWAKENING_CONFLICTS,
  CURRENT_AWAKENING_POOL,
  DraftAction,
  type PlayingSide,
  type Striker,
  STRIKER_POOL,
  STRIKER_SEQUENCE,
  type StrikerDraftState,
} from "@os-tools/shared";

import { GameRuleError } from "../gameRuleError.js";

export function getAvailableAwakenings(bannedStarts: readonly Awakening[], first?: Awakening): Awakening[] {
  const firstPool = CURRENT_AWAKENING_POOL.filter((a) => {
    return !bannedStarts.includes(a);
  });

  if (!firstPool.length) {
    throw new GameRuleError("No awakenings available: all are banned.");
  }

  if (first === undefined) {
    return firstPool;
  }

  const conflicts = Object.hasOwn(AWAKENING_CONFLICTS, first) ? AWAKENING_CONFLICTS[first] : [];
  const available = firstPool.filter((a) => {
    return a !== first && !conflicts.includes(a);
  });

  if (!available.length) {
    throw new GameRuleError(`No compatible second awakening available after choosing '${first}'.`);
  }

  return available;
}

export function applyStrikerAction(
  state: StrikerDraftState,
  striker: string | null,
): { state: StrikerDraftState; side: PlayingSide } {
  const entry = STRIKER_SEQUENCE[state.step];

  if (!entry) {
    throw new GameRuleError("No more steps remaining");
  }

  let selected: Striker | null = null;

  if (striker === null) {
    if (entry.action !== DraftAction.Ban) {
      throw new GameRuleError("No-ban is only allowed on ban steps");
    }
  } else {
    const candidate = STRIKER_POOL.find((name) => {
      return name === striker;
    });
    if (!candidate) {
      throw new GameRuleError("Invalid striker");
    }

    selected = candidate;

    if (
      state.actions.some((a) => {
        return a.striker === striker;
      })
    ) {
      throw new GameRuleError("Striker already used");
    }
  }

  const step = state.step + 1;

  return {
    state: {
      ...state,
      actions: [...state.actions, { striker: selected, team: entry.team, step: state.step, action: entry.action }],
      step,
      done: step >= STRIKER_SEQUENCE.length,
    },
    side: entry.team,
  };
}
