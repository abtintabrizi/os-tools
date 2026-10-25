import { Striker } from "./common.js";
import type { SequenceStep } from "../types/common.js";

export const STRIKER_SEQUENCE: readonly SequenceStep[] = [
  { team: "blue", action: "ban" },
  { team: "red", action: "ban" },
  { team: "blue", action: "pick" },
  { team: "red", action: "pick" },
  { team: "red", action: "pick" },
  { team: "blue", action: "pick" },
  { team: "blue", action: "pick" },
  { team: "red", action: "pick" },
];

export const STRIKER_POOL: readonly string[] = Object.values(Striker);
