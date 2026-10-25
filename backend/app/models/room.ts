import type { DraftType } from "./common.js";
import type { MapDraftState } from "./mapDraft.js";
import type { StrikerDraftState } from "./strikerDraft.js";

export type RoomState = MapDraftState | StrikerDraftState;

// Business code depends on this interface; only entity helpers use the database client.
export interface RoomStore {
  get(type: DraftType, roomId: string): Promise<RoomState | null>;
  save(type: DraftType, state: RoomState): Promise<void>;
}
