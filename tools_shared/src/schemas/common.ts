import { z } from "zod";

import { ReplayEventType, Team } from "../constants/game.js";

export const playingSideSchema = z.enum([Team.Blue, Team.Red]);
export type PlayingSide = z.infer<typeof playingSideSchema>;

export const roomRequestSchema = z.object({ roomId: z.string().min(1) });
export type RoomRequest = z.infer<typeof roomRequestSchema>;

export const readyRequestSchema = z.object({ side: playingSideSchema });
export type ReadyRequest = z.infer<typeof readyRequestSchema>;

const replayFields = {
  atMs: z.number().int().nonnegative(),
  side: playingSideSchema,
  value: z.string().nullable(),
};

export const replayEventSchema = z.discriminatedUnion("type", [
  z.object({ ...replayFields, type: z.literal(ReplayEventType.Pending) }),
  z.object({ ...replayFields, type: z.literal(ReplayEventType.Action), step: z.number().int().nonnegative() }),
]);
export type ReplayEvent = z.infer<typeof replayEventSchema>;

export const commonStateSchema = z.object({
  roomId: z.string(),
  blueName: z.string(),
  redName: z.string(),
  step: z.number().int().nonnegative(),
  done: z.boolean(),
  readyBlue: z.boolean(),
  readyRed: z.boolean(),
  pendingBlue: z.string().nullable(),
  pendingRed: z.string().nullable(),
  stepStartedAt: z.number().nullable(),
  replayStartedAt: z.number().nullable().optional(),
  replayEvents: z.array(replayEventSchema).optional(),
  serverTime: z.number().optional(),
});
export type CommonState = z.infer<typeof commonStateSchema>;
