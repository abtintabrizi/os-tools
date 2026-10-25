import { useCallback, useState } from "react";

import { BOARD_HEIGHT, BOARD_WIDTH } from "../constants";
import type { BoardState } from "../types";

export function initialBoard(): BoardState {
  return {
    drawings: [],
    pieces: [
      {
        id: "core",
        name: "Core",
        icon: "/other/Core.png",
        position: { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 },
      },
    ],
  };
}

export function useTacticsBoard() {
  const [history, setHistory] = useState<{
    past: BoardState[];
    present: BoardState;
    future: BoardState[];
  }>(() => ({ past: [], present: initialBoard(), future: [] }));

  const commit = useCallback(
    (next: BoardState) =>
      setHistory((h) => ({
        past: [...h.past, h.present],
        present: next,
        future: [],
      })),
    [],
  );

  const undo = useCallback(
    () =>
      setHistory((h) =>
        h.past.length
          ? {
              past: h.past.slice(0, -1),
              present: h.past[h.past.length - 1],
              future: [h.present, ...h.future],
            }
          : h,
      ),
    [],
  );

  const redo = useCallback(
    () =>
      setHistory((h) =>
        h.future.length
          ? {
              past: [...h.past, h.present],
              present: h.future[0],
              future: h.future.slice(1),
            }
          : h,
      ),
    [],
  );

  return {
    board: history.present,
    commit,
    undo,
    redo,
    canUndo: !!history.past.length,
    canRedo: !!history.future.length,
  };
}
