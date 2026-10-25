import type { z } from "zod";

import type {
  createStrikerDraftRoomRequestSchema,
  strikerDraftActionRequestSchema,
  strikerDraftActionSchema,
  strikerDraftPendingRequestSchema,
  strikerDraftStateSchema,
} from "../schemas/strikerDraft.js";

export type StrikerDraftAction = z.infer<typeof strikerDraftActionSchema>;

export type StrikerDraftState = z.infer<typeof strikerDraftStateSchema>;

export type CreateStrikerDraftRoomRequest = z.infer<typeof createStrikerDraftRoomRequestSchema>;

export type StrikerDraftActionRequest = z.infer<typeof strikerDraftActionRequestSchema>;

export type StrikerDraftPendingRequest = z.infer<typeof strikerDraftPendingRequestSchema>;
