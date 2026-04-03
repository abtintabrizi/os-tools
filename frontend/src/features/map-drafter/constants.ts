import { SequenceStep } from "@/features/common/types";
import { Sequence, SequenceKey } from "@/features/map-drafter/types";
import { Team, DraftAction } from "@/features/common/constants";

export const BO3_SEQUENCE: SequenceStep[] = [
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Ban },
  { team: Team.Blue, action: DraftAction.Pick },
  { team: Team.Red, action: DraftAction.Pick },
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Ban },
];

export const BO1_SEQUENCE: SequenceStep[] = [
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Pick },
];

export const SEQUENCE_MAP: Record<SequenceKey, SequenceStep[]> = {
  [Sequence.BO1]: BO1_SEQUENCE,
  [Sequence.BO3]: BO3_SEQUENCE,
};
