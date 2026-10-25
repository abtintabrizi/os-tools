import { z } from "zod";

import { Awakening } from "../constants/awakenings.js";
import { DraftAction, Sequence } from "../constants/game.js";
import { GameMap } from "../constants/maps.js";
import { commonStateSchema, playingSideSchema } from "./common.js";

export const mapDraftActionSchema = z.object({
  map: z.enum(GameMap),
  team: playingSideSchema.nullable(),
  step: z.number().int().nonnegative().nullable().optional(),
  action: z.enum(DraftAction),
});

export const mapDraftStateSchema = commonStateSchema.extend({
  maps: z.array(z.enum(GameMap)),
  bestOf: z.enum(Sequence),
  actions: z.array(mapDraftActionSchema),
  strikerLobbies: z.record(z.string(), z.object({ roomId: z.string(), firstPick: z.string() })).nullable(),
  bannedAwakenings: z.array(z.enum(Awakening)).nullable(),
});

export const createMapDraftRoomRequestSchema = z.object({
  bestOf: z.enum(Sequence),
  blueName: z.string(),
  redName: z.string(),
  maps: z.array(z.enum(GameMap)),
});

export const mapDraftActionRequestSchema = z.object({
  map: z.enum(GameMap),
  step: z.number().int().nonnegative(),
});

export const mapDraftPendingRequestSchema = z.object({ side: playingSideSchema, map: z.enum(GameMap).nullable() });

export const setStrikerRoomRequestSchema = z.object({
  map: z.enum(GameMap),
  strikerRoomId: z.string().min(1),
  firstPick: z.string(),
  bannedAwakenings: z.array(z.enum(Awakening)),
});
