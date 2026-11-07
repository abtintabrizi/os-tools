import { BOARD_HEIGHT, BOARD_WIDTH, CORE_CROP, CORE_SIZE, PIECE_SIZE, TEAM_COLORS } from "../constants";
import type { BoardState, Point } from "../types";
import { arrowHead } from "./geometry";
import { loadImage } from "./images";

export async function exportImage(board: BoardState, map: { name: string; image: string }) {
  const sources = [...new Set([map.image, ...board.pieces.map((p) => p.icon)])];
  const images = new Map(await Promise.all(sources.map(async (src) => [src, await loadImage(src)] as const)));

  const canvas = document.createElement("canvas");
  canvas.width = BOARD_WIDTH;
  canvas.height = BOARD_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image export is unavailable in this browser.");
  }

  context.fillStyle = "#111118";
  context.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

  const background = images.get(map.image)!;
  const scale = Math.min(BOARD_WIDTH / background.naturalWidth, BOARD_HEIGHT / background.naturalHeight);
  const width = background.naturalWidth * scale;
  const height = background.naturalHeight * scale;
  context.drawImage(background, (BOARD_WIDTH - width) / 2, (BOARD_HEIGHT - height) / 2, width, height);

  const stroke = (points: Point[]) => {
    context.beginPath();
    points.forEach((p, index) => (index ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y)));
    context.stroke();
  };

  context.lineCap = "round";
  context.lineJoin = "round";

  for (const drawing of board.drawings) {
    context.strokeStyle = drawing.color;
    context.lineWidth = drawing.width;
    stroke(drawing.points);
    if (drawing.kind === "arrow") {
      stroke(arrowHead(drawing));
    }
  }

  for (const piece of board.pieces) {
    const size = piece.id === "core" ? CORE_SIZE : PIECE_SIZE;
    const x = piece.position.x - size / 2;
    const y = piece.position.y - size / 2;

    if (piece.id === "core") {
      context.drawImage(
        images.get(piece.icon)!,
        CORE_CROP.x,
        CORE_CROP.y,
        CORE_CROP.size,
        CORE_CROP.size,
        x,
        y,
        size,
        size,
      );
    } else {
      context.save();
      context.beginPath();
      context.arc(piece.position.x, piece.position.y, size / 2, 0, Math.PI * 2);
      context.clip();
      context.drawImage(images.get(piece.icon)!, x, y, size, size);
      context.restore();
    }

    if (piece.team) {
      context.strokeStyle = TEAM_COLORS[piece.team];
      context.lineWidth = 3;
      context.beginPath();
      context.arc(piece.position.x, piece.position.y, size / 2, 0, Math.PI * 2);
      context.stroke();
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Could not create PNG."))), "image/png"),
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tactics-${map.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
