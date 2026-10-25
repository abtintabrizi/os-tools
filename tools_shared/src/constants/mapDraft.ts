import type { SequenceStep } from "../types/common.js";
import type { Sequence } from "../types/mapDraft.js";

export const MIN_MAPS = 7;

export const BO3_FORMATS: readonly Sequence[] = ["bo3", "bo3eu", "bo3sa"];

export const SEQUENCE_MAPPING: Record<Sequence, readonly SequenceStep[]> = {
  bo3: [
    { team: "blue", action: "ban" },
    { team: "red", action: "ban" },
    { team: "blue", action: "pick", gameNum: 2 },
    { team: "red", action: "pick", gameNum: 1 },
    { team: "blue", action: "ban" },
    { team: "red", action: "ban" },
  ],
  bo3eu: [
    { team: "blue", action: "ban" },
    { team: "red", action: "ban" },
    { team: "red", action: "pick", gameNum: 1 },
    { team: "blue", action: "pick", gameNum: 2 },
    { team: "blue", action: "ban" },
    { team: "red", action: "ban" },
  ],
  bo3sa: [
    { team: "blue", action: "ban" },
    { team: "red", action: "ban" },
    { team: "blue", action: "pick", gameNum: 1 },
    { team: "red", action: "pick", gameNum: 2 },
    { team: "red", action: "ban" },
    { team: "blue", action: "ban" },
  ],
  bo1: [
    { team: "blue", action: "ban" },
    { team: "blue", action: "ban" },
    { team: "blue", action: "ban" },
    { team: "red", action: "pick", gameNum: 1 },
  ],
  bo2: [
    { team: "blue", action: "ban" },
    { team: "red", action: "ban" },
    { team: "red", action: "ban" },
    { team: "blue", action: "ban" },
    { team: "red", action: "pick", gameNum: 1 },
    { team: "blue", action: "pick", gameNum: 2 },
  ],
};
