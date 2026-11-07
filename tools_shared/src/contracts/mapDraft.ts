import { oc } from "@orpc/contract";

import { readyRequestSchema, roomRequestSchema } from "../schemas/common.js";
import {
  createMapDraftRoomRequestSchema,
  mapDraftActionRequestSchema,
  mapDraftPendingRequestSchema,
  mapDraftStateSchema,
  setStrikerRoomRequestSchema,
} from "../schemas/mapDraft.js";

export const mapDraftContract = {
  createRoom: oc.input(createMapDraftRoomRequestSchema).output(mapDraftStateSchema),
  getRoom: oc.input(roomRequestSchema).output(mapDraftStateSchema),
  ready: oc.input(roomRequestSchema.extend(readyRequestSchema.shape)).output(mapDraftStateSchema),
  setPending: oc.input(roomRequestSchema.extend(mapDraftPendingRequestSchema.shape)).output(mapDraftStateSchema),
  applyAction: oc.input(roomRequestSchema.extend(mapDraftActionRequestSchema.shape)).output(mapDraftStateSchema),
  linkStrikerRoom: oc.input(roomRequestSchema.extend(setStrikerRoomRequestSchema.shape)).output(mapDraftStateSchema),
};
