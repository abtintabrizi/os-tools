import type { z } from "zod";

import type { DraftAction } from "../constants/game.js";
import type {
  commonStateSchema,
  playingSideSchema,
  readyRequestSchema,
  replayEventSchema,
  roomRequestSchema,
} from "../schemas/common.js";

export type PlayingSide = z.infer<typeof playingSideSchema>;

export interface SequenceStep {
  team: PlayingSide;
  action: DraftAction;
  gameNum?: number;
}

export type ReplayEvent = z.infer<typeof replayEventSchema>;

export type CommonState = z.infer<typeof commonStateSchema>;

export type ReadyRequest = z.infer<typeof readyRequestSchema>;

export type RoomRequest = z.infer<typeof roomRequestSchema>;
