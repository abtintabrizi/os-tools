import {
  type CreateStrikerDraftRoomRequest as CreateStrikerRoomConfig,
  DraftType,
  type Striker,
  type StrikerDraftState,
  type Team,
} from "@os-tools/shared";
import { useCallback } from "react";

import { useRoomApi } from "../../common/hooks/useRoomApi";

export function useStrikerDraftApi(roomId: string | null, side?: string, live = true) {
  const api = useRoomApi<StrikerDraftState>(roomId, DraftType.StrikerDraft, side, live);

  const create = useCallback(
    (config: CreateStrikerRoomConfig) => api.create(config),
    [api.create], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const applyAction = useCallback(
    (striker: Striker | null) => api.applyAction({ striker, step: api.state?.step }),
    [api.applyAction, api.state?.step], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setPending = useCallback(
    (side: Exclude<Team, Team.Spectator>, striker: Striker | null) => api.setPending({ side, striker }),
    [api.setPending], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return { ...api, create, applyAction, setPending };
}
