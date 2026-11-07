import type {
  CreateMapDraftRoomRequest,
  MapDraftActionRequest,
  MapDraftPendingRequest,
  MapDraftState,
  ReadyRequest,
  SetStrikerRoomRequest,
} from "@os-tools/shared";
import { DraftType } from "@os-tools/shared";
import { Router } from "express";

import type { MapDraftManager } from "../managers/mapDraftManager.js";
import type { RoomManager } from "../managers/roomManager.js";

export function mapDraftRouter(manager: MapDraftManager, rooms: RoomManager): Router {
  const router = Router();

  router.post<Record<string, never>, MapDraftState, CreateMapDraftRoomRequest>("/rooms", async (req, res) => {
    res.json(await manager.createRoom(req.body));
  });

  router.get("/rooms/:roomId", async (req, res) => {
    res.json(await rooms.get(DraftType.MapDraft, req.params.roomId));
  });

  router.post<{ roomId: string }, MapDraftState, ReadyRequest>("/rooms/:roomId/ready", async (req, res) => {
    res.json(await rooms.ready(DraftType.MapDraft, req.params.roomId, req.body.side));
  });

  router.post<{ roomId: string }, MapDraftState, MapDraftPendingRequest>("/rooms/:roomId/pending", async (req, res) => {
    const body = req.body;

    res.json(await rooms.pending(DraftType.MapDraft, req.params.roomId, body.side, body.map));
  });

  router.post<{ roomId: string }, MapDraftState, MapDraftActionRequest>("/rooms/:roomId/action", async (req, res) => {
    const body = req.body;

    res.json(await rooms.action(DraftType.MapDraft, req.params.roomId, body.step, body.map));
  });

  router.post<{ roomId: string }, MapDraftState, SetStrikerRoomRequest>(
    "/rooms/:roomId/striker-room",
    async (req, res) => {
      res.json(await manager.linkStrikerRoom(req.params.roomId, req.body));
    },
  );

  return router;
}
