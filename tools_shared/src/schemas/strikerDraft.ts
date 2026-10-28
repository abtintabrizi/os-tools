import { z } from "zod";

import { Awakening } from "../constants/awakenings.js";
import { AwakeningMode, DraftAction } from "../constants/game.js";
import { GameMap } from "../constants/maps.js";
import { Striker } from "../constants/strikers.js";
import { commonStateSchema, playingSideSchema } from "./common.js";

export const strikerDraftActionSchema = z.object({
  striker: z.enum(Striker).nullable(),
  team: playingSideSchema,
  step: z.number().int().nonnegative(),
  action: z.enum(DraftAction),
});
export type StrikerDraftAction = z.infer<typeof strikerDraftActionSchema>;

export const strikerDraftStateSchema = commonStateSchema.extend({
  map: z.enum(GameMap),
  awakenings: z.array(z.enum(Awakening)),
  actions: z.array(strikerDraftActionSchema),
  bannedStarts: z.array(z.enum(Awakening)),
  awakeningMode: z.enum(AwakeningMode),
});
export type StrikerDraftState = z.infer<typeof strikerDraftStateSchema>;

export const createStrikerDraftRoomRequestSchema = z.object({
  blueName: z.string(),
  redName: z.string(),
  map: z.enum(GameMap),
  awakeningMode: z.enum(AwakeningMode),
  bannedStarts: z.array(z.enum(Awakening)),
  customAwakenings: z.array(z.enum(Awakening)),
});
export type CreateStrikerDraftRoomRequest = z.infer<typeof createStrikerDraftRoomRequestSchema>;

export const strikerDraftActionRequestSchema = z.object({
  striker: z.enum(Striker).nullable(),
  step: z.number().int().nonnegative(),
});
export type StrikerDraftActionRequest = z.infer<typeof strikerDraftActionRequestSchema>;

export const strikerDraftPendingRequestSchema = z.object({
  side: playingSideSchema,
  striker: z.enum(Striker).nullable(),
});
export type StrikerDraftPendingRequest = z.infer<typeof strikerDraftPendingRequestSchema>;
