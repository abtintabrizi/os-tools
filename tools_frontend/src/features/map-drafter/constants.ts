import { BO3_FORMATS, Sequence } from "@os-tools/shared";

export const FORMAT_GROUPS: { label: string; formats: readonly Sequence[] }[] = [
  { label: "Best of 3", formats: BO3_FORMATS },
  { label: "Other formats", formats: [Sequence.BO1, Sequence.BO2] },
];

export const SEQUENCE_LABELS: Record<Sequence, string> = {
  [Sequence.BO1]: "BO1",
  [Sequence.BO2]: "BO2",
  [Sequence.BO3]: "BO3 (NA)",
  [Sequence.BO3EU]: "BO3 (EU)",
  [Sequence.BO3SA]: "BO3 (SA)",
};
