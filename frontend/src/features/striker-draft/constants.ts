import { Team, DraftAction } from "@/features/common/constants";
import type { SequenceStep } from "@/features/common/types";

export const STRIKER_SEQUENCE: SequenceStep[] = [
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Ban },
  { team: Team.Blue, action: DraftAction.Pick },
  { team: Team.Red, action: DraftAction.Pick },
  { team: Team.Red, action: DraftAction.Pick },
  { team: Team.Blue, action: DraftAction.Pick },
  { team: Team.Blue, action: DraftAction.Pick },
  { team: Team.Red, action: DraftAction.Pick },
];
