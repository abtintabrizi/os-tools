import type { SequenceStep } from "@os-tools/shared/types/common";
import { BO3_FORMATS, SEQUENCE_MAPPING } from "@os-tools/shared/constants/mapDraft";
import { Sequence, type SequenceKey } from "./types";

const {
  bo1: BO1_SEQUENCE,
  bo2: BO2_SEQUENCE,
  bo3: BO3_SEQUENCE,
  bo3eu: BO3EU_SEQUENCE,
  bo3sa: BO3SA_SEQUENCE,
} = SEQUENCE_MAPPING;
export { BO1_SEQUENCE, BO2_SEQUENCE, BO3_SEQUENCE, BO3EU_SEQUENCE, BO3SA_SEQUENCE };

export const BO3_SEQUENCES = {
  [Sequence.BO3]: BO3_SEQUENCE,
  [Sequence.BO3EU]: BO3EU_SEQUENCE,
  [Sequence.BO3SA]: BO3SA_SEQUENCE,
};

export const OTHER_SEQUENCES = {
  [Sequence.BO1]: BO1_SEQUENCE,
  [Sequence.BO2]: BO2_SEQUENCE,
};

export const SEQUENCE_MAP: Record<SequenceKey, readonly SequenceStep[]> = {
  ...BO3_SEQUENCES,
  ...OTHER_SEQUENCES,
};

export { BO3_FORMATS };

export const FORMAT_GROUPS: { label: string; formats: readonly SequenceKey[] }[] = [
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
