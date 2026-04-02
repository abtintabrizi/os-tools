export type Side = "blue" | "red" | "spectator";
export type ActionType = "ban" | "pick";
export interface DraftAction {
  map: string;
  team: string | null;
  action: ActionType;
}

export interface SequenceStep {
  team: string;
  action: ActionType;
}

export interface DraftState {
  roomId: string;
  blueName: string;
  redName: string;
  maps: string[];
  step: number;
  actions: DraftAction[];
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
