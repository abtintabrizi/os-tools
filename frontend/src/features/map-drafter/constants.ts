import { SequenceStep } from "@/features/common/types";
import { SequenceKey } from "./types/index";

export const BO3_SEQUENCE: SequenceStep[] = [
  { team: "blue", action: "ban" },
  { team: "red", action: "ban" },
  { team: "blue", action: "pick" },
  { team: "red", action: "pick" },
  { team: "blue", action: "ban" },
  { team: "red", action: "ban" },
];

export const BO1_SEQUENCE: SequenceStep[] = [
  { team: "blue", action: "ban" },
  { team: "blue", action: "ban" },
  { team: "blue", action: "ban" },
  { team: "red", action: "pick" },
];

export const SEQUENCE_MAP: Record<SequenceKey, SequenceStep[]> = {
  bo1: BO1_SEQUENCE,
  bo3: BO3_SEQUENCE,
};
