import type { z } from "zod";

import type {
  createMapDraftRoomRequestSchema,
  mapDraftActionRequestSchema,
  mapDraftActionSchema,
  mapDraftPendingRequestSchema,
  mapDraftStateSchema,
  setStrikerRoomRequestSchema,
} from "../schemas/mapDraft.js";

export type MapDraftAction = z.infer<typeof mapDraftActionSchema>;

export type MapDraftState = z.infer<typeof mapDraftStateSchema>;

export type CreateMapDraftRoomRequest = z.infer<typeof createMapDraftRoomRequestSchema>;

export type MapDraftActionRequest = z.infer<typeof mapDraftActionRequestSchema>;

export type MapDraftPendingRequest = z.infer<typeof mapDraftPendingRequestSchema>;

export type SetStrikerRoomRequest = z.infer<typeof setStrikerRoomRequestSchema>;
