import type { Awakening } from "../constants/awakenings.js";
import type { DraftAction, Sequence, Team } from "../constants/game.js";
import type { GameMap } from "../constants/maps.js";
import type { CommonState, PlayingSide } from "./common.js";

export interface MapDraftAction {
  map: GameMap;
  team: PlayingSide | null;
  step?: number | null;
  action: DraftAction;
}

export interface MapDraftState extends CommonState {
  maps: GameMap[];
  bestOf: Sequence;
  actions: MapDraftAction[];
  strikerLobbies: Record<string, { roomId: string; firstPick: string }> | null;
  bannedAwakenings: Awakening[] | null;
}

export interface CreateMapDraftRoomRequest {
  bestOf: Sequence;
  blueName: string;
  redName: string;
  maps: GameMap[];
}

export interface MapDraftActionRequest {
  map: GameMap;
  step: number;
}

export interface MapDraftPendingRequest {
  side: Team;
  map: GameMap | null;
}

export interface SetStrikerRoomRequest {
  map: GameMap;
  roomId: string;
  firstPick: string;
  bannedAwakenings: Awakening[];
}
