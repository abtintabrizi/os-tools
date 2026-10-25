export type Team = "blue" | "red" | "spectator";

export type PlayingSide = Exclude<Team, "spectator">;

export type DraftAction = "ban" | "pick";

export type DraftType = "map-draft" | "striker-draft";

export interface SequenceStep {
  team: PlayingSide;
  action: DraftAction;
  game_num?: number;
}

export type ReplayEvent =
  | { type: "pending"; atMs: number; side: PlayingSide; value: string | null }
  | { type: "action"; atMs: number; side: PlayingSide; step: number; value: string | null };

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
