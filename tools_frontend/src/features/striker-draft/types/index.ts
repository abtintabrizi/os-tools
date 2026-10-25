import type { SequenceStep } from "@os-tools/shared";

export interface IndexedStep extends SequenceStep {
  globalIdx: number;
}
