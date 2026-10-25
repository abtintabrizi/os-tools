import type { DraftAction, ReplayEventType, Team } from "../constants/game.js";

export type PlayingSide = Exclude<Team, Team.Spectator>;

export interface SequenceStep {
  team: PlayingSide;
  action: DraftAction;
  gameNum?: number;
}

export type ReplayEvent =
  | { type: ReplayEventType.Pending; atMs: number; side: PlayingSide; value: string | null }
  | { type: ReplayEventType.Action; atMs: number; side: PlayingSide; step: number; value: string | null };

export interface CommonState {
  roomId: string;
  blueName: string;
  redName: string;
  step: number;
  done: boolean;
  readyBlue: boolean;
  readyRed: boolean;
  pendingBlue: string | null;
  pendingRed: string | null;
  stepStartedAt: number | null;
  replayStartedAt?: number | null;
  replayEvents?: ReplayEvent[];
  serverTime?: number;
}

export interface ReadyRequest {
  side: Team;
}
