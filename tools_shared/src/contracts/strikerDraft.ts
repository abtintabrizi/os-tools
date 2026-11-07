import { oc } from "@orpc/contract";

import { readyRequestSchema, roomRequestSchema } from "../schemas/common.js";
import {
  createStrikerDraftRoomRequestSchema,
  strikerDraftActionRequestSchema,
  strikerDraftPendingRequestSchema,
  strikerDraftStateSchema,
} from "../schemas/strikerDraft.js";

export const strikerDraftContract = {
  createRoom: oc.input(createStrikerDraftRoomRequestSchema).output(strikerDraftStateSchema),
  getRoom: oc.input(roomRequestSchema).output(strikerDraftStateSchema),
  ready: oc.input(roomRequestSchema.extend(readyRequestSchema.shape)).output(strikerDraftStateSchema),
  setPending: oc
    .input(roomRequestSchema.extend(strikerDraftPendingRequestSchema.shape))
    .output(strikerDraftStateSchema),
  applyAction: oc
    .input(roomRequestSchema.extend(strikerDraftActionRequestSchema.shape))
    .output(strikerDraftStateSchema),
};
