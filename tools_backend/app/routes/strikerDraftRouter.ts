import type {
  CreateStrikerDraftRoomRequest,
  ReadyRequest,
  StrikerDraftActionRequest,
  StrikerDraftPendingRequest,
  StrikerDraftState,
} from "@os-tools/shared";
import { DraftType } from "@os-tools/shared";
import { Router } from "express";

import type { RoomManager } from "../managers/roomManager.js";
import type { StrikerDraftManager } from "../managers/strikerDraftManager.js";

export function strikerDraftRouter(manager: StrikerDraftManager, rooms: RoomManager): Router {
  const router = Router();

  router.post<Record<string, never>, StrikerDraftState, CreateStrikerDraftRoomRequest>("/rooms", async (req, res) => {
    res.json(await manager.createRoom(req.body));
  });

  router.get("/rooms/:roomId", async (req, res) => {
    res.json(await rooms.get(DraftType.StrikerDraft, req.params.roomId));
  });

  router.post<{ roomId: string }, StrikerDraftState, ReadyRequest>("/rooms/:roomId/ready", async (req, res) => {
    res.json(await rooms.ready(DraftType.StrikerDraft, req.params.roomId, req.body.side));
  });

  router.post<{ roomId: string }, StrikerDraftState, StrikerDraftPendingRequest>(
    "/rooms/:roomId/pending",
    async (req, res) => {
      const body = req.body;

      res.json(await rooms.pending(DraftType.StrikerDraft, req.params.roomId, body.side, body.striker));
    },
  );

  router.post<{ roomId: string }, StrikerDraftState, StrikerDraftActionRequest>(
    "/rooms/:roomId/action",
    async (req, res) => {
      const body = req.body;

      res.json(await rooms.action(DraftType.StrikerDraft, req.params.roomId, body.step, body.striker));
    },
  );

  return router;
}
