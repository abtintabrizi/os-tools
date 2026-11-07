import { BO3_FORMATS, SEQUENCE_MAPPING } from "../constants/mapDraft.js";
import type { MapDraftState } from "../models/mapDraft.js";
import type { PlayingSide } from "../models/common.js";
import { RequestError } from "./requestError.js";

export function appendDecider(state: MapDraftState): MapDraftState {
  if (!BO3_FORMATS.includes(state.bestOf)) return state;

  const used = new Set(state.actions.map((a) => a.map));
  const remaining = state.maps.filter((map) => !used.has(map));

  if (remaining.length !== 1) return state;

  return { ...state, actions: [...state.actions, { map: remaining[0]!, team: null, action: "pick" }] };
}

export function applyMapAction(state: MapDraftState, map: string): { state: MapDraftState; side: PlayingSide } {
  const sequence = SEQUENCE_MAPPING[state.bestOf];
  const entry = sequence?.[state.step];

  if (!entry) throw new RequestError(400, "No more steps remaining");

  if (!state.maps.includes(map)) throw new RequestError(400, "Map not in pool");

  if (state.actions.some((a) => a.map === map)) throw new RequestError(400, "Map already used");

  const step = state.step + 1;
  const updated: MapDraftState = {
    ...state,
    actions: [...state.actions, { map, team: entry.team, step: state.step, action: entry.action }],
    step,
    done: step >= sequence.length,
  };

  return { state: updated.done ? appendDecider(updated) : updated, side: entry.team };
}
