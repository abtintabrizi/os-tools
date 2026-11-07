import { BO3_FORMATS, DraftAction, type MapDraftState, type PlayingSide, SEQUENCE_MAPPING } from "@os-tools/shared";

import { GameRuleError } from "../gameRuleError.js";

export function appendDecider(state: MapDraftState): MapDraftState {
  if (!BO3_FORMATS.includes(state.bestOf)) {
    return state;
  }

  const used = new Set(
    state.actions.map((a) => {
      return a.map;
    }),
  );
  const remaining = state.maps.filter((map) => {
    return !used.has(map);
  });

  if (remaining.length !== 1) {
    return state;
  }

  return { ...state, actions: [...state.actions, { map: remaining[0]!, team: null, action: DraftAction.Pick }] };
}

export function applyMapAction(state: MapDraftState, map: string): { state: MapDraftState; side: PlayingSide } {
  const sequence = SEQUENCE_MAPPING[state.bestOf];
  const entry = sequence?.[state.step];

  if (!entry) {
    throw new GameRuleError("No more steps remaining");
  }

  const selected = state.maps.find((name) => {
    return name === map;
  });

  if (!selected) {
    throw new GameRuleError("Map not in pool");
  }

  if (
    state.actions.some((a) => {
      return a.map === map;
    })
  ) {
    throw new GameRuleError("Map already used");
  }

  const step = state.step + 1;
  const updated: MapDraftState = {
    ...state,
    actions: [...state.actions, { map: selected, team: entry.team, step: state.step, action: entry.action }],
    step,
    done: step >= sequence.length,
  };

  return { state: updated.done ? appendDecider(updated) : updated, side: entry.team };
}
