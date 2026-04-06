import { ActionType } from "@/features/common/types";

export enum Sequence {
  BO1 = "bo1",
  BO3 = "bo3",
  BO3EU = "bo3eu",
}

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

export type SequenceKey = `${Sequence}`;
