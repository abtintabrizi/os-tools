export type Side = "blue" | "red" | "spectator";
export type ActionType = "ban" | "pick";

export interface SequenceStep {
  team: string;
  action: ActionType;
}
