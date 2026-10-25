import {
  type Awakening,
  type CreateMapDraftRoomRequest,
  DraftType,
  type GameMap,
  type MapDraftState,
  type Team,
} from "@os-tools/shared";
import { useCallback } from "react";

import { useRoomApi } from "../../common/hooks/useRoomApi";

export function useMapDraftApi(roomId: string | null, side?: string, live = true) {
  const api = useRoomApi<MapDraftState>(roomId, DraftType.MapDraft, side, live);

  const create = useCallback(
    (config: CreateMapDraftRoomRequest) => api.create(config),
    [api.create], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const applyAction = useCallback(
    (map: GameMap) => api.applyAction({ map, step: api.state?.step }),
    [api.applyAction, api.state?.step], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setPending = useCallback(
    (side: Exclude<Team, Team.Spectator>, map: string | null) => api.setPending({ side, map }),
    [api.setPending], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setStrikerRoom = useCallback(
    (map: string, roomId: string, firstPick: string, bannedAwakenings: Awakening[]) =>
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
