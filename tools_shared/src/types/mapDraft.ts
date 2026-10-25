import type { CommonState, DraftAction, PlayingSide, Team } from "./common.js";

export type Sequence = `${import("../constants/sequence.js").Sequence}`;

export interface MapDraftAction {
  map: string;
  team: PlayingSide | null;
  step?: number | null;
  action: DraftAction;
}

export interface MapDraftState extends CommonState {
  maps: string[];
  bestOf: Sequence;
  actions: MapDraftAction[];
  strikerLobbies: Record<string, { roomId: string; firstPick: string }> | null;
  bannedAwakenings: string[] | null;
}

export interface CreateMapDraftRoomRequest {
  bestOf: string;
  blueName: string;
  redName: string;
  maps: string[];
}

export interface MapDraftActionRequest {
  map: string;
  step: number;
}

export interface MapDraftPendingRequest {
  side: Team;
  map: string | null;
}

export interface SetStrikerRoomRequest {
  map: string;
  roomId: string;
  firstPick: string;
  bannedAwakenings: string[];
}
