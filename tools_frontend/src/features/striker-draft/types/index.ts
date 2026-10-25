import type { SequenceStep } from "@os-tools/shared/types/common";

export type { StrikerDraftState, StrikerDraftAction } from "@os-tools/shared/types/strikerDraft";

export interface IndexedStep extends SequenceStep {
  globalIdx: number;
}
