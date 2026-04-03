import { useCallback } from "react";
import { useRoomApi } from "@/features/common/hooks/useRoomApi";
import type { MapDraftState, SequenceKey } from "@map-drafter/types";
import type { Team } from "@/features/common/constants";

export interface CreateRoomConfig {
  blueName: string;
  redName: string;
  bestOf: SequenceKey;
  maps: string[];
}

export function useMapDraftApi(roomId: string | null) {
  const api = useRoomApi<MapDraftState>(roomId, "map-draft");

  const create = useCallback(
    (config: CreateRoomConfig) => api.create(config),
    [api.create],
  );

  const applyAction = useCallback(
    (map: string) => api.applyAction({ map }),
    [api.applyAction],
  );

  const setPending = useCallback(
    (side: Team.Blue | Team.Red, map: string | null) =>
      api.setPending({ side, map }),
    [api.setPending],
  );

  return { ...api, create, applyAction, setPending };
}
