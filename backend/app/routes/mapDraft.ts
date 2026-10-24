import { Router } from "express";

import { methodNotAllowed } from "./methodNotAllowed.js";

import type { MapDraftManager } from "../managers/mapDraftManager.js";
import type { RoomManager } from "../managers/roomManager.js";
import * as validate from "../utils/requestValidation.js";

export function mapDraftRouter(manager: MapDraftManager, rooms: RoomManager): Router {
  const router = Router({ caseSensitive: true });

  router.post("/rooms", async (req, res) => {
    res.json(await manager.createRoom(validate.createMap(req.body)));
  });
  router.all("/rooms", methodNotAllowed("POST"));

  router.head("/rooms/:roomId", methodNotAllowed("GET"));

  router.get("/rooms/:roomId", async (req, res) => {
    res.json(await rooms.get("map-draft", req.params.roomId));
  });
  router.all("/rooms/:roomId", methodNotAllowed("GET"));

  router.post("/rooms/:roomId/ready", async (req, res) => {
    res.json(await rooms.ready("map-draft", req.params.roomId, validate.ready(req.body).side));
  });
  router.all("/rooms/:roomId/ready", methodNotAllowed("POST"));

  router.post("/rooms/:roomId/pending", async (req, res) => {
    const body = validate.mapPending(req.body);

    res.json(await rooms.pending("map-draft", req.params.roomId, body.side, body.map));
  });
  router.all("/rooms/:roomId/pending", methodNotAllowed("POST"));

  router.post("/rooms/:roomId/action", async (req, res) => {
    const body = validate.mapAction(req.body);

    res.json(await rooms.action("map-draft", req.params.roomId, body.step, body.map));
  });
  router.all("/rooms/:roomId/action", methodNotAllowed("POST"));

  router.post("/rooms/:roomId/striker-room", async (req, res) => {
    res.json(await manager.linkStrikerRoom(req.params.roomId, validate.strikerRoom(req.body)));
  });
  router.all("/rooms/:roomId/striker-room", methodNotAllowed("POST"));

  return router;
}
