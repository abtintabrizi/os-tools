import { useCallback } from "react";
import { useRoomApi } from "@/features/common/hooks/useRoomApi";
import type { MapDraftState, SequenceKey } from "@map-drafter/types";
import type { Team } from "@/features/common/constants/constants";

export interface CreateRoomConfig {
  blueName: string;
  redName: string;
  bestOf: SequenceKey;
  maps: string[];
}

export function useMapDraftApi(roomId: string | null, side?: string) {
  const api = useRoomApi<MapDraftState>(roomId, "map-draft", side);

  const create = useCallback(
    (config: CreateRoomConfig) => api.create(config),
    [api.create], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const applyAction = useCallback(
    (map: string) => api.applyAction({ map }),
    [api.applyAction], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setPending = useCallback(
    (side: Team.Blue | Team.Red, map: string | null) =>
      api.setPending({ side, map }),
    [api.setPending], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setGame1FirstPick = useCallback(
    (firstPick: string) => api.post("game1-first-pick", { firstPick }),
    [api.post], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setStrikerRooms = useCallback(
    (rooms: Record<string, string>, bannedAwakenings: string[]) =>
      api.post("striker-rooms", { rooms, bannedAwakenings }),
    [api.post], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    ...api,
    create,
    applyAction,
    setPending,
    setGame1FirstPick,
    setStrikerRooms,
  };
}
