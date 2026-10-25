import { useCallback } from "react";
import { useRoomApi } from "@/features/common/hooks/useRoomApi";
import type { MapDraftState, SequenceKey } from "@map-drafter/types";
import type { Team } from "@/features/common/constants/constants";

import type { CreateMapDraftRoomRequest } from "@os-tools/shared/types/mapDraft";

export type CreateRoomConfig = Omit<CreateMapDraftRoomRequest, "bestOf"> & { bestOf: SequenceKey };

export function useMapDraftApi(roomId: string | null, side?: string, live = true) {
  const api = useRoomApi<MapDraftState>(roomId, "map-draft", side, live);

  const create = useCallback(
    (config: CreateRoomConfig) => api.create(config),
    [api.create], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const applyAction = useCallback(
    (map: string) => api.applyAction({ map, step: api.state?.step }),
    [api.applyAction, api.state?.step], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setPending = useCallback(
    (side: Exclude<Team, "spectator">, map: string | null) => api.setPending({ side, map }),
    [api.setPending], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setStrikerRoom = useCallback(
    (map: string, roomId: string, firstPick: string, bannedAwakenings: string[]) =>
      api.post("striker-room", { map, roomId, firstPick, bannedAwakenings }),
    [api.post], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    ...api,
    create,
    applyAction,
    setPending,
    setStrikerRoom,
  };
}
