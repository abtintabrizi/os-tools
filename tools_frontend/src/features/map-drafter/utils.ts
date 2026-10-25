import { DraftAction, type MapDraftState, type SequenceStep } from "@os-tools/shared";

import { MapStatus } from "./types";

export function deriveMapStatuses(state: MapDraftState, sequence: readonly SequenceStep[]): Record<string, MapStatus> {
  const statuses: Record<string, MapStatus> = {};
  state.maps.forEach((m) => (statuses[m] = "available"));

  const pickSteps = sequence.filter((s) => s.action === DraftAction.Pick);
  let pickCount = 0;
  state.actions.forEach((a) => {
    if (a.action === DraftAction.Ban) {
      statuses[a.map] = "banned";
    } else if (a.team === null) {
      statuses[a.map] = "decider";
    } else {
      const gameNum = pickSteps[pickCount].gameNum ?? pickCount + 1;
      pickCount++;
      statuses[a.map] = `picked-g${gameNum}` as MapStatus;
    }
  });

  return statuses;
}
