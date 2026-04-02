import { ActionType } from "@/features/common/types";

export interface MapDraftAction {
  map: string;
  team: string | null;
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
}

export type MapStatus =
  | "available"
  | "banned"
  | "picked-g1"
  | "picked-g2"
  | "picked-g3"
  | "decider";

export type SequenceKey = "bo1" | "bo3";
