import type { SequenceStep } from "../types/common.js";
import { DraftAction, Team } from "./game.js";

export enum Striker {
  AiMi = "Ai.Mi",
  Asher = "Asher",
  Atlas = "Atlas",
  Drekar = "Drek'ar",
  Dubu = "Dubu",
  Era = "Era",
  Estelle = "Estelle",
  Finii = "Finii",
  Juliette = "Juliette",
  Juno = "Juno",
  Kai = "Kai",
  Kazan = "Kazan",
  Luna = "Luna",
  Mako = "Mako",
  Nao = "Nao",
  Octavia = "Octavia",
  Rasmus = "Rasmus",
  Rune = "Rune",
  Vyce = "Vyce",
  X = "X",
  Zentaro = "Zentaro",
}

export const STRIKER_SEQUENCE: readonly SequenceStep[] = [
  { team: Team.Blue, action: DraftAction.Ban },
  { team: Team.Red, action: DraftAction.Ban },
  { team: Team.Blue, action: DraftAction.Pick },
  { team: Team.Red, action: DraftAction.Pick },
  { team: Team.Red, action: DraftAction.Pick },
  { team: Team.Blue, action: DraftAction.Pick },
  { team: Team.Blue, action: DraftAction.Pick },
  { team: Team.Red, action: DraftAction.Pick },
];

export const STRIKER_POOL: readonly Striker[] = Object.values(Striker);
