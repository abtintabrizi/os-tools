import { ALL_MAPS, type MapDefinition } from "@/features/common/constants/constants";

function tacticsMaps(map: MapDefinition, parentName?: string): { name: string; image: string }[] {
  const name = parentName ? `${parentName} — ${map.name}` : map.name;
  if (map.variants?.length) {
    return map.variants.flatMap((variant) => tacticsMaps(variant, name));
  }

  return map.image ? [{ name, image: map.image }] : [];
}

export const TACTICS_MAPS = ALL_MAPS.flatMap((map) => tacticsMaps(map)).sort((a, b) => a.name.localeCompare(b.name));

export const BOARD_WIDTH = 1200;
export const BOARD_HEIGHT = 640;

export const PIECE_SIZE = 48;
export const CORE_SIZE = 32;

// The supplied core has transparent padding around its centered 500px ball.
export const CORE_CROP = { x: 704, y: 284, size: 512 };

export const TEAM_COLORS = { blue: "#3b82f6", red: "#ef4444" };
export const DRAW_COLORS = ["#ffffff", "#3b82f6", "#ef4444", "#facc15"];

export const DRAG_TYPE = "application/x-os-tactics-striker";
