import type { SequenceStep } from "../models/common.js";
import type { Sequence } from "../models/mapDraft.js";

export const MIN_MAPS = 7;

export const BO3_FORMATS: readonly Sequence[] = ["bo3", "bo3eu", "bo3sa"];

export const SEQUENCE_MAPPING: Record<Sequence, readonly SequenceStep[]> = {
  bo3: [
    { team: "blue", action: "ban" },
    { team: "red", action: "ban" },
    { team: "blue", action: "pick", game_num: 2 },
    { team: "red", action: "pick", game_num: 1 },
    { team: "blue", action: "ban" },
    { team: "red", action: "ban" },
  ],
  bo3eu: [
    { team: "blue", action: "ban" },
    { team: "red", action: "ban" },
    { team: "red", action: "pick", game_num: 1 },
    { team: "blue", action: "pick", game_num: 2 },
    { team: "blue", action: "ban" },
    { team: "red", action: "ban" },
  ],
  bo3sa: [
    { team: "blue", action: "ban" },
    { team: "red", action: "ban" },
    { team: "blue", action: "pick", game_num: 1 },
    { team: "red", action: "pick", game_num: 2 },
    { team: "red", action: "ban" },
    { team: "blue", action: "ban" },
  ],
  bo1: [
    { team: "blue", action: "ban" },
    { team: "blue", action: "ban" },
    { team: "blue", action: "ban" },
    { team: "red", action: "pick", game_num: 1 },
  ],
  bo2: [
    { team: "blue", action: "ban" },
    { team: "red", action: "ban" },
    { team: "red", action: "ban" },
    { team: "blue", action: "ban" },
    { team: "red", action: "pick", game_num: 1 },
    { team: "blue", action: "pick", game_num: 2 },
  ],
};
