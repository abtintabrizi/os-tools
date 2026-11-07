import { MAP_METADATA } from "../common/constants/constants";

export const TACTICS_MAPS = Object.entries(MAP_METADATA)
  .flatMap(([name, metadata]) => {
    if (metadata.variants?.length) {
      return metadata.variants.flatMap((variant) => {
        return variant.image ? [{ name: `${name} — ${variant.name}`, image: variant.image }] : [];
      });
    }

    return metadata.image ? [{ name, image: metadata.image }] : [];
  })
  .sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

export const BOARD_WIDTH = 1200;
export const BOARD_HEIGHT = 640;

export const PIECE_SIZE = 48;
export const CORE_SIZE = 32;

// The supplied core has transparent padding around its centered 500px ball.
export const CORE_CROP = { x: 704, y: 284, size: 512 };

export const TEAM_COLORS = { blue: "#3b82f6", red: "#ef4444" };
export const DRAW_COLORS = ["#ffffff", "#3b82f6", "#ef4444", "#facc15"];

export const DRAG_TYPE = "application/x-os-tactics-striker";
