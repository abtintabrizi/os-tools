import { type Awakening, DraftType, type GameMap, type PlayingSide } from "@os-tools/shared";
import { useCallback } from "react";

import { rpc } from "../../common/api";
import { useRoomApi } from "../../common/hooks/useRoomApi";

// oRPC creates a new proxy for each property access; keep the hook dependency stable.
const client = rpc.mapDraft;

export function useMapDraftApi(roomId: string | null, side?: string, live = true) {
  const api = useRoomApi(roomId, DraftType.MapDraft, client, side, live);
  const step = api.state?.step;
  const { runMutation } = api;

  const applyAction = useCallback(
    async (map: GameMap): Promise<void> => {
      if (!roomId || step === undefined) {
        return;
      }

      await runMutation(() => rpc.mapDraft.applyAction({ roomId, step, map }));
    },
    [roomId, step, runMutation],
  );

  const setPending = useCallback(
    async (side: PlayingSide, map: GameMap | null): Promise<void> => {
      if (!roomId) {
        return;
      }

      await runMutation(() => rpc.mapDraft.setPending({ roomId, side, map }));
    },
    [roomId, runMutation],
  );

  const ready = useCallback(
    async (side: PlayingSide): Promise<void> => {
      if (!roomId) {
        return;
      }

      await runMutation(() => rpc.mapDraft.ready({ roomId, side }));
    },
    [roomId, runMutation],
  );

  const setStrikerRoom = useCallback(
    async (map: GameMap, strikerRoomId: string, firstPick: string, bannedAwakenings: Awakening[]): Promise<void> => {
      if (!roomId) {
        return;
      }

      await rpc.mapDraft.linkStrikerRoom({ roomId, map, strikerRoomId, firstPick, bannedAwakenings });
    },
    [roomId],
  );

  return { ...api, applyAction, setPending, ready, setStrikerRoom };
}
