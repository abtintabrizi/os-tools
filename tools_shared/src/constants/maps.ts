import type { SequenceStep } from "../types/common.js";
import { DraftAction, Sequence, Team } from "./game.js";

export enum GameMap {
  AhtenCity = "Ahten City",
  AimisApp = "Ai.Mi's App",
  AtlasLab = "Atlas's Lab",
  ClarionTestChamber = "Clarion Test Chamber",
  DemonDais = "Demon Dais",
  GatesOfObscura = "Gates of Obscura",
  InkysSplashZone = "Inky's Splash Zone",
  NightMarket = "Night Market",
  OniVillage = "Oni Village",
  TaikoTemple = "Taiko Temple",
}

export const MIN_MAPS = 7;

export const BO3_FORMATS: readonly Sequence[] = [Sequence.BO3, Sequence.BO3EU, Sequence.BO3SA];

export const SEQUENCE_MAPPING: Record<Sequence, readonly SequenceStep[]> = {
  [Sequence.BO3]: [
    { team: Team.Blue, action: DraftAction.Ban },
    { team: Team.Red, action: DraftAction.Ban },
    { team: Team.Blue, action: DraftAction.Pick, gameNum: 2 },
    { team: Team.Red, action: DraftAction.Pick, gameNum: 1 },
    { team: Team.Blue, action: DraftAction.Ban },
    { team: Team.Red, action: DraftAction.Ban },
  ],
  [Sequence.BO3EU]: [
    { team: Team.Blue, action: DraftAction.Ban },
    { team: Team.Red, action: DraftAction.Ban },
    { team: Team.Red, action: DraftAction.Pick, gameNum: 1 },
    { team: Team.Blue, action: DraftAction.Pick, gameNum: 2 },
    { team: Team.Blue, action: DraftAction.Ban },
    { team: Team.Red, action: DraftAction.Ban },
  ],
  [Sequence.BO3SA]: [
    { team: Team.Blue, action: DraftAction.Ban },
    { team: Team.Red, action: DraftAction.Ban },
    { team: Team.Blue, action: DraftAction.Pick, gameNum: 1 },
    { team: Team.Red, action: DraftAction.Pick, gameNum: 2 },
    { team: Team.Red, action: DraftAction.Ban },
    { team: Team.Blue, action: DraftAction.Ban },
  ],
  [Sequence.BO1]: [
    { team: Team.Blue, action: DraftAction.Ban },
    { team: Team.Blue, action: DraftAction.Ban },
    { team: Team.Blue, action: DraftAction.Ban },
    { team: Team.Red, action: DraftAction.Pick, gameNum: 1 },
  ],
  [Sequence.BO2]: [
    { team: Team.Blue, action: DraftAction.Ban },
    { team: Team.Red, action: DraftAction.Ban },
    { team: Team.Red, action: DraftAction.Ban },
    { team: Team.Blue, action: DraftAction.Ban },
    { team: Team.Red, action: DraftAction.Pick, gameNum: 1 },
    { team: Team.Blue, action: DraftAction.Pick, gameNum: 2 },
  ],
};
