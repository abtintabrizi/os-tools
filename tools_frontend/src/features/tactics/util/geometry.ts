import { BOARD_HEIGHT, BOARD_WIDTH } from "../constants";
import type { Drawing, Point } from "../types";

export function clampPoint(point: Point, radius = 0): Point {
  return {
    x: Math.max(radius, Math.min(BOARD_WIDTH - radius, point.x)),
    y: Math.max(radius, Math.min(BOARD_HEIGHT - radius, point.y)),
  };
}

export function arrowHead(drawing: Drawing): Point[] {
  const end = drawing.points[drawing.points.length - 1];
  const start = drawing.points[0];
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const length = 12 + drawing.width * 2;

  return [
    {
      x: end.x - length * Math.cos(angle - Math.PI / 6),
      y: end.y - length * Math.sin(angle - Math.PI / 6),
    },
    end,
    {
      x: end.x - length * Math.cos(angle + Math.PI / 6),
      y: end.y - length * Math.sin(angle + Math.PI / 6),
    },
  ];
}

export const pointString = (points: Point[]) => points.map((p) => `${p.x},${p.y}`).join(" ");
