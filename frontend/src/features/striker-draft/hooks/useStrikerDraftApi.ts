import { useCallback } from "react";
import { useRoomApi } from "@/features/common/hooks/useRoomApi";
import type { StrikerDraftState } from "@/features/striker-draft/types";
import type { Team } from "@/features/common/constants";

export interface CreateStrikerRoomConfig {
  blueName: string;
  redName: string;
  map: string;
  awakeningMode: string;
  customAwakenings?: string[];
}

export function useStrikerDraftApi(roomId: string | null) {
  const api = useRoomApi<StrikerDraftState>(roomId, "striker-draft");

  const create = useCallback(
    (config: CreateStrikerRoomConfig) => api.create(config),
    [api.create], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const applyAction = useCallback(
    (striker: string | null) => api.applyAction({ striker }),
    [api.applyAction], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setPending = useCallback(
    (side: Team.Blue | Team.Red, striker: string | null) =>
      api.setPending({ side, striker }),
    [api.setPending], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return { ...api, create, applyAction, setPending };
}
