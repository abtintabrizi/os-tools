import { useCallback } from "react";
import { useRoomApi } from "@/features/common/hooks/useRoomApi";
import type { StrikerDraftState } from "@/features/striker-draft/types";
import type { Team } from "@/features/common/constants/constants";

export type { CreateStrikerDraftRoomRequest as CreateStrikerRoomConfig } from "@os-tools/shared/types/strikerDraft";
import type { CreateStrikerDraftRoomRequest as CreateStrikerRoomConfig } from "@os-tools/shared/types/strikerDraft";

export function useStrikerDraftApi(roomId: string | null, side?: string, live = true) {
  const api = useRoomApi<StrikerDraftState>(roomId, "striker-draft", side, live);

  const create = useCallback(
    (config: CreateStrikerRoomConfig) => api.create(config),
    [api.create], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const applyAction = useCallback(
    (striker: string | null) => api.applyAction({ striker, step: api.state?.step }),
    [api.applyAction, api.state?.step], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setPending = useCallback(
    (side: Exclude<Team, "spectator">, striker: string | null) => api.setPending({ side, striker }),
    [api.setPending], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return { ...api, create, applyAction, setPending };
}
