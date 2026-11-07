import { DraftType, type PlayingSide, type Striker } from "@os-tools/shared";
import { useCallback } from "react";

import { rpc } from "../../common/api";
import { useRoomApi } from "../../common/hooks/useRoomApi";

// oRPC creates a new proxy for each property access; keep the hook dependency stable.
const client = rpc.strikerDraft;

export function useStrikerDraftApi(roomId: string | null, side?: string, live = true) {
  const api = useRoomApi(roomId, DraftType.StrikerDraft, client, side, live);
  const step = api.state?.step;
  const { runMutation } = api;

  const applyAction = useCallback(
    async (striker: Striker | null): Promise<void> => {
      if (!roomId || step === undefined) {
        return;
      }

      await runMutation(() => rpc.strikerDraft.applyAction({ roomId, step, striker }));
    },
    [roomId, step, runMutation],
  );

  const setPending = useCallback(
    async (side: PlayingSide, striker: Striker | null): Promise<void> => {
      if (!roomId) {
        return;
      }

      await runMutation(() => rpc.strikerDraft.setPending({ roomId, side, striker }));
    },
    [roomId, runMutation],
  );

  const ready = useCallback(
    async (side: PlayingSide): Promise<void> => {
      if (!roomId) {
        return;
      }

      await runMutation(() => rpc.strikerDraft.ready({ roomId, side }));
    },
    [roomId, runMutation],
  );

  return { ...api, applyAction, setPending, ready };
}
