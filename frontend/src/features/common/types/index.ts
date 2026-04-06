import { Team, DraftAction } from "@/features/common/constants";

export type Side = Team;
export type ActionType = DraftAction;

export interface SequenceStep {
  team: Team;
  action: DraftAction;
  gameNum?: number;
}
