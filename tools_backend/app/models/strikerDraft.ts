export type {
  StrikerDraftState,
  StrikerDraftAction,
  StrikerDraftActionRequest,
  StrikerDraftPendingRequest,
} from "@os-tools/shared/types/strikerDraft";

import type { CreateStrikerDraftRoomRequest as RoomRequest } from "@os-tools/shared/types/strikerDraft";

// Validation fills optional request fields before managers consume them.
export type CreateStrikerDraftRoomRequest = Required<RoomRequest>;
