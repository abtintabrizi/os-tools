import { SequenceStep } from "@/features/common/types";
import { Sequence, SequenceKey } from "@/features/map-drafter/types";
import { Team, DraftAction } from "@/features/common/constants/constants";

export const BO3EU_SEQUENCE: SequenceStep[] = [
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Pick, gameNum: 1 },
  { team: Team.Blue, action: DraftAction.Pick, gameNum: 2 },
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Ban },
];

export const BO3_SEQUENCE: SequenceStep[] = [
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Ban },
  { team: Team.Blue, action: DraftAction.Pick, gameNum: 2 },
  { team: Team.Red, action: DraftAction.Pick, gameNum: 1 },
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Ban },
];

export const BO1_SEQUENCE: SequenceStep[] = [
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Pick, gameNum: 1 },
];

export const SEQUENCE_MAP: Record<SequenceKey, SequenceStep[]> = {
  [Sequence.BO1]: BO1_SEQUENCE,
  [Sequence.BO3]: BO3_SEQUENCE,
  [Sequence.BO3EU]: BO3EU_SEQUENCE,
};

export const SEQUENCE_LABELS: Record<SequenceKey, string> = {
  [Sequence.BO1]: "BO1",
  [Sequence.BO3]: "BO3",
  [Sequence.BO3EU]: "BO3 (EU)",
};
