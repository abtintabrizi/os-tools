import type { CommonState, DraftAction, PlayingSide, Team } from "./common.js";

export interface StrikerDraftAction {
  striker: string | null;
  team: PlayingSide;
  step: number;
  action: DraftAction;
}

export interface StrikerDraftState extends CommonState {
  map: string;
  awakenings: string[];
  actions: StrikerDraftAction[];
  bannedStarts: string[] | null;
  awakeningMode: string;
}

export interface CreateStrikerDraftRoomRequest {
  blueName: string;
  redName: string;
  map: string;
  awakeningMode: string;
  bannedStarts: string[] | null;
  customAwakenings: string[] | null;
}

export interface StrikerDraftActionRequest {
  striker: string | null;
  step: number;
}

export interface StrikerDraftPendingRequest {
  side: Team;
  striker: string | null;
}
