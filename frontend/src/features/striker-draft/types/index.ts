export interface StrikerDraftState {
  roomId: string;
  blueName: string;
  redName: string;
  map: string;
  awakenings: string[];
  step: number;
  actions: StrikerDraftAction[];
  done: boolean;
  readyBlue: boolean;
  readyRed: boolean;
  pendingBlue: string | null;
  pendingRed: string | null;
  stepStartedAt: number | null;
  bannedStarts: string[] | null;
  awakeningMode: "random" | "custom";
  serverTime?: number;
}

import type { Team, DraftAction } from "@/features/common/constants/constants";

export interface StrikerDraftAction {
  striker: string;
  team: Team | null;
  step: number;
  action: string;
}

export interface IndexedStep {
  team: Team;
  action: DraftAction;
  globalIdx: number;
}
