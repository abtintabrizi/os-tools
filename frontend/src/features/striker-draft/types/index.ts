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
}

import type { Team, DraftAction } from "@/features/common/constants/constants";

export interface StrikerDraftAction {
  striker: string;
  team: string | null;
  action: string;
}

export interface IndexedStep {
  team: Team;
  action: DraftAction;
  globalIdx: number;
}
