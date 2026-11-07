import { Router } from "express";

import { methodNotAllowed } from "./methodNotAllowed.js";

import type { StrikerDraftManager } from "../managers/strikerDraftManager.js";
import type { RoomManager } from "../managers/roomManager.js";
import * as validate from "../utils/requestValidation.js";

export function strikerDraftRouter(manager: StrikerDraftManager, rooms: RoomManager): Router {
  const router = Router({ caseSensitive: true });

  router.post("/rooms", async (req, res) => {
    res.json(await manager.createRoom(validate.createStriker(req.body)));
  });
  router.all("/rooms", methodNotAllowed("POST"));

  router.head("/rooms/:roomId", methodNotAllowed("GET"));

  router.get("/rooms/:roomId", async (req, res) => {
    res.json(await rooms.get("striker-draft", req.params.roomId));
  });
  router.all("/rooms/:roomId", methodNotAllowed("GET"));

  router.post("/rooms/:roomId/ready", async (req, res) => {
    res.json(await rooms.ready("striker-draft", req.params.roomId, validate.ready(req.body).side));
  });
  router.all("/rooms/:roomId/ready", methodNotAllowed("POST"));

  router.post("/rooms/:roomId/pending", async (req, res) => {
    const body = validate.strikerPending(req.body);

    res.json(await rooms.pending("striker-draft", req.params.roomId, body.side, body.striker));
  });
  router.all("/rooms/:roomId/pending", methodNotAllowed("POST"));

  router.post("/rooms/:roomId/action", async (req, res) => {
    const body = validate.strikerAction(req.body);

    res.json(await rooms.action("striker-draft", req.params.roomId, body.step, body.striker));
  });
  router.all("/rooms/:roomId/action", methodNotAllowed("POST"));

  return router;
}
