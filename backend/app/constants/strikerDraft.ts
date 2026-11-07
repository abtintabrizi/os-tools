import type { SequenceStep } from "../models/common.js";

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

export const STRIKER_POOL: readonly string[] = [
  "Ai.Mi",
  "Asher",
  "Atlas",
  "Drek'ar",
  "Dubu",
  "Era",
  "Estelle",
  "Finii",
  "Juliette",
  "Juno",
  "Kai",
  "Kazan",
  "Luna",
  "Mako",
  "Nao",
  "Octavia",
  "Rasmus",
  "Rune",
  "Vyce",
  "X",
  "Zentaro",
];
