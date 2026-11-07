export enum Team {
  Blue = "blue",
  Red = "red",
  Spectator = "spectator",
}

export enum DraftAction {
  Ban = "ban",
  Pick = "pick",
}

export interface SequenceStep {
  team: Exclude<Team, Team.Spectator>;
  action: DraftAction;
  gameNum?: number;
}

export enum Sequence {
  BO1 = "bo1",
  BO3 = "bo3",
  BO3EU = "bo3eu",
  BO2 = "bo2",
  BO3SA = "bo3sa",
}

export const TIMER_SECONDS = 30;
export const COUNTDOWN_SECONDS = 5;

export enum DraftType {
  MapDraft = "map-draft",
  StrikerDraft = "striker-draft",
}

export enum ReplayEventType {
  Pending = "pending",
  Action = "action",
}

export enum AwakeningMode {
  Random = "random",
  Custom = "custom",
}
