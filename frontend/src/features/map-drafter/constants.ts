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

export const BO3SA_SEQUENCE: SequenceStep[] = [
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Ban },
  { team: Team.Blue, action: DraftAction.Pick, gameNum: 1 },
  { team: Team.Red, action: DraftAction.Pick, gameNum: 2 },
  { team: Team.Red, action: DraftAction.Ban },
  { team: Team.Blue, action: DraftAction.Ban },
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

export const BO2_SEQUENCE: SequenceStep[] = [
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Ban },
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Pick, gameNum: 1 },
  { team: Team.Blue, action: DraftAction.Pick, gameNum: 2 },
];

export const BO3_SEQUENCES = {
  [Sequence.BO3]: BO3_SEQUENCE,
  [Sequence.BO3EU]: BO3EU_SEQUENCE,
  [Sequence.BO3SA]: BO3SA_SEQUENCE,
};

export const OTHER_SEQUENCES = {
  [Sequence.BO1]: BO1_SEQUENCE,
  [Sequence.BO2]: BO2_SEQUENCE,
};

export const SEQUENCE_MAP: Record<SequenceKey, SequenceStep[]> = {
  ...BO3_SEQUENCES,
  ...OTHER_SEQUENCES,
};

export const BO3_FORMATS = Object.keys(BO3_SEQUENCES) as SequenceKey[];

export const FORMAT_GROUPS: { label: string; formats: SequenceKey[] }[] = [
  { label: "Best of 3", formats: BO3_FORMATS },
  {
    label: "Other formats",
    formats: Object.keys(OTHER_SEQUENCES) as SequenceKey[],
  },
];

export const SEQUENCE_LABELS: Record<SequenceKey, string> = {
  [Sequence.BO1]: "BO1",
  [Sequence.BO2]: "BO2",
  [Sequence.BO3]: "BO3 (NA)",
  [Sequence.BO3EU]: "BO3 (EU)",
  [Sequence.BO3SA]: "BO3 (SA)",
};
