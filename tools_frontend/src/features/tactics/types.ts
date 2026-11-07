import { Team } from "@os-tools/shared";

export type PlayingTeam = Exclude<Team, Team.Spectator>;

export type Tool = "move" | "arrow" | "freehand" | "delete";

export type Point = { x: number; y: number };

export type Drawing = {
  id: string;
  kind: "arrow" | "freehand";
  points: Point[];
  color: string;
  width: number;
};

export type Piece = {
  id: string;
  position: Point;
  icon: string;
  name: string;
  team?: PlayingTeam;
};

export type BoardState = { drawings: Drawing[]; pieces: Piece[] };
