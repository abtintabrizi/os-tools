import { DraftState, MapStatus } from "@/features/map-drafter/types";

export function deriveMapStatuses(
  state: DraftState,
): Record<string, MapStatus> {
  const statuses: Record<string, MapStatus> = {};
  state.maps.forEach((m) => (statuses[m] = "available"));

  let pickCount = 0;
  state.actions.forEach((a) => {
    if (a.action === "ban") {
      statuses[a.map] = "banned";
    } else {
      pickCount++;
      statuses[a.map] = `picked-g${pickCount}` as MapStatus;
    }
  });

  return statuses;
}
