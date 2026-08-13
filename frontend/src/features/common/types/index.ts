import { Team, DraftAction } from "@/features/common/constants/constants";

export type Side = Team;
export type ActionType = DraftAction;

export interface SequenceStep {
  team: Team;
  action: DraftAction;
  gameNum?: number;
}
export type ReplayEvent =
  | { type: "pending"; atMs: number; side: Team; value: string | null }
  | {
      type: "action";
      atMs: number;
      side: Team;
      step: number;
      value: string | null;
    };
