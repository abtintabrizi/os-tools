import { ActionType } from "@/features/common/types";
import type { Team } from "@/features/common/constants/constants";

export enum Sequence {
  BO1 = "bo1",
  BO3 = "bo3",
  BO3EU = "bo3eu",
  BO2 = "bo2",
}

export interface MapDraftAction {
  map: string;
  team: Team | null;
  step: number | null;
  action: ActionType;
}

export interface MapDraftState {
  roomId: string;
  blueName: string;
  redName: string;
  maps: string[];
  step: number;
  actions: MapDraftAction[];
  done: boolean;
  bestOf: SequenceKey;
  readyBlue: boolean;
  readyRed: boolean;
  pendingBlue: string | null;
  pendingRed: string | null;
  stepStartedAt: number | null;
  strikerLobbies: Record<string, { roomId: string; firstPick: string }> | null;
  bannedAwakenings: string[] | null;
  serverTime?: number;
}

export type MapStatus =
  | "available"
  | "banned"
  | "picked-g1"
  | "picked-g2"
  | "picked-g3"
  | "decider";

export type SequenceKey = `${Sequence}`;
