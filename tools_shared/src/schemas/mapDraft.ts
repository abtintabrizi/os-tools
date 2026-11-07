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
export type MapDraftAction = z.infer<typeof mapDraftActionSchema>;

export const mapDraftStateSchema = commonStateSchema.extend({
  maps: z.array(z.enum(GameMap)),
  bestOf: z.enum(Sequence),
  actions: z.array(mapDraftActionSchema),
  strikerLobbies: z.record(z.string(), z.object({ roomId: z.string(), firstPick: z.string() })).nullable(),
  bannedAwakenings: z.array(z.enum(Awakening)).nullable(),
});
export type MapDraftState = z.infer<typeof mapDraftStateSchema>;

export const createMapDraftRoomRequestSchema = z.object({
  bestOf: z.enum(Sequence),
  blueName: z.string(),
  redName: z.string(),
  maps: z.array(z.enum(GameMap)),
});
export type CreateMapDraftRoomRequest = z.infer<typeof createMapDraftRoomRequestSchema>;

export const mapDraftActionRequestSchema = z.object({
  map: z.enum(GameMap),
  step: z.number().int().nonnegative(),
});
export type MapDraftActionRequest = z.infer<typeof mapDraftActionRequestSchema>;

export const mapDraftPendingRequestSchema = z.object({ side: playingSideSchema, map: z.enum(GameMap).nullable() });
export type MapDraftPendingRequest = z.infer<typeof mapDraftPendingRequestSchema>;

export const setStrikerRoomRequestSchema = z.object({
  map: z.enum(GameMap),
  strikerRoomId: z.string().min(1),
  firstPick: z.string(),
  bannedAwakenings: z.array(z.enum(Awakening)),
});
export type SetStrikerRoomRequest = z.infer<typeof setStrikerRoomRequestSchema>;
