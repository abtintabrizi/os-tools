import type { Awakening } from "../constants/awakenings.js";
import type { AwakeningMode, DraftAction, Team } from "../constants/game.js";
import type { GameMap } from "../constants/maps.js";
import type { Striker } from "../constants/strikers.js";
import type { CommonState, PlayingSide } from "./common.js";

export interface StrikerDraftAction {
  striker: Striker | null;
  team: PlayingSide;
  step: number;
  action: DraftAction;
}

export interface StrikerDraftState extends CommonState {
  map: GameMap;
  awakenings: Awakening[];
  actions: StrikerDraftAction[];
  bannedStarts: Awakening[];
  awakeningMode: AwakeningMode;
}

export interface CreateStrikerDraftRoomRequest {
  blueName: string;
  redName: string;
  map: GameMap;
  awakeningMode: AwakeningMode;
  bannedStarts: Awakening[];
  customAwakenings: Awakening[];
}

export interface StrikerDraftActionRequest {
  striker: Striker | null;
  step: number;
}

export interface StrikerDraftPendingRequest {
  side: Team;
  striker: Striker | null;
}
