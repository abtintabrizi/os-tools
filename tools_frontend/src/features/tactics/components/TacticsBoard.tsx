import { type Striker } from "@os-tools/shared";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { STRIKER_METADATA } from "../../common/constants/constants";
import { BOARD_HEIGHT, BOARD_WIDTH, CORE_CROP, CORE_SIZE, DRAG_TYPE, PIECE_SIZE, TEAM_COLORS } from "../constants";
import { useMapImage } from "../hooks/useMapImage";
import { initialBoard } from "../hooks/useTacticsBoard";
import type { BoardState, Drawing, PlayingTeam, Point, Tool } from "../types";
import { arrowHead, clampPoint, pointString } from "../util/geometry";
import MapLoading from "./MapLoading";

type Gesture = {
  pointerId: number;
  start: Point;
  original: BoardState;
  id: string;
  drawing?: Drawing;
};

type Props = {
  board: BoardState;
  commit: (board: BoardState) => void;
  map: string;
  tool: Tool;
  color: string;
  width: number;
  team: PlayingTeam;
  onImageError: () => void;
  cancelVersion: number;
};

export default function TacticsBoard({
  board,
  commit,
  map,
  tool,
  color,
  width,
  team,
  onImageError,
  cancelVersion,
}: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const previewRef = useRef<BoardState | null>(null);
  const [preview, setPreview] = useState<BoardState | null>(null);
  const clipId = useId();
  const { displayedMap, loading, failed } = useMapImage(map, onImageError);

  const cancel = () => {
    gesture.current = null;
    previewRef.current = null;
    setPreview(null);
  };

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancel();
      }
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, []);

  useEffect(() => {
    cancel();
  }, [cancelVersion, map, tool]);

  const point = (clientX: number, clientY: number) => {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) {
      return { x: 0, y: 0 };
    }
    const result = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());

    return { x: result.x, y: result.y };
  };

  const outside = (position: Point) =>
    position.x < 0 || position.x > BOARD_WIDTH || position.y < 0 || position.y > BOARD_HEIGHT;

  const removeObject = (id: string) => {
    cancel();
    commit({
      drawings: board.drawings.filter((drawing) => drawing.id !== id),
      pieces: board.pieces.filter((piece) => piece.id !== id),
    });
  };

  const start = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || gesture.current) {
      return;
    }

    const target = (event.target as Element).closest("[data-object]");
    const id = target?.getAttribute("data-object");

    if (tool === "delete") {
      if (id) {
        removeObject(id);
      }

      return;
    }

    const position = clampPoint(point(event.clientX, event.clientY));
    if (tool === "move" && !id) {
      return;
    }

    const drawing: Drawing | undefined =
      tool === "arrow" || tool === "freehand"
        ? {
            id: crypto.randomUUID(),
            kind: tool,
            points: [position, position],
            color,
            width,
          }
        : undefined;

    gesture.current = {
      pointerId: event.pointerId,
      start: position,
      original: board,
      id: drawing?.id ?? id!,
      drawing,
    };
    svg.current?.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const move = (event: ReactPointerEvent<SVGSVGElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) {
      return;
    }

    const rawPosition = point(event.clientX, event.clientY);
    const position = current.drawing ? clampPoint(rawPosition) : rawPosition;
    let next: BoardState;

    if (current.drawing) {
      current.drawing = {
        ...current.drawing,
        points: current.drawing.kind === "arrow" ? [current.start, position] : [...current.drawing.points, position],
      };
      next = {
        ...current.original,
        drawings: [...current.original.drawings, current.drawing],
      };
    } else {
      const dx = position.x - current.start.x;
      const dy = position.y - current.start.y;

      next = {
        pieces: current.original.pieces.map((p) =>
          p.id === current.id
            ? {
                ...p,
                position: { x: p.position.x + dx, y: p.position.y + dy },
              }
            : p,
        ),
        drawings: current.original.drawings.map((d) =>
          d.id === current.id
            ? {
                ...d,
                points: d.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              }
            : d,
        ),
      };
    }
    previewRef.current = next;
    setPreview(next);
  };

  const finish = (event: ReactPointerEvent<SVGSVGElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) {
      return;
    }

    const end = point(event.clientX, event.clientY);
    const isPiece = !current.drawing && current.original.pieces.some((piece) => piece.id === current.id);

    if (isPiece && outside(end)) {
      commit({
        ...current.original,
        pieces: current.original.pieces.filter((piece) => piece.id !== current.id),
      });
    } else if (
      Math.hypot(end.x - current.start.x, end.y - current.start.y) > 2 ||
      (current.drawing?.kind === "freehand" && current.drawing.points.length > 3)
    ) {
      move(event);
      if (previewRef.current) {
        commit({
          ...previewRef.current,
          pieces: previewRef.current.pieces.map((piece) => ({
            ...piece,
            position: clampPoint(piece.position, (piece.id === "core" ? CORE_SIZE : PIECE_SIZE) / 2 + 2),
          })),
        });
      }
    }
    cancel();
    if (svg.current?.hasPointerCapture(event.pointerId)) {
      svg.current.releasePointerCapture(event.pointerId);
    }
  };

  const displayed = preview ?? board;

  return (
    <div
      className="relative mx-auto shrink-0 overflow-hidden rounded-xl bg-tools-carbon ring-1 ring-inset ring-white/10"
      style={{ width: `min(100cqw, calc(100cqh * ${BOARD_WIDTH / BOARD_HEIGHT}), 1120px)` }}
    >
      <svg
        ref={svg}
        viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
        className="block w-full select-none"
        style={{
          touchAction: "none",
          cursor: tool === "move" ? "grab" : "crosshair",
        }}
        role="img"
        aria-busy={loading}
        aria-label="Tactics board. Drag strikers onto the map and use the toolbar to draw."
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onContextMenu={(event) => {
          const id = (event.target as Element).closest("[data-object]")?.getAttribute("data-object");
          if (!id) {
            return;
          }

          event.preventDefault();
          removeObject(id);
        }}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes(DRAG_TYPE)) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          const value = event.dataTransfer.getData(DRAG_TYPE);

          if (value === "core") {
            cancel();
            const core = {
              ...initialBoard().pieces[0],
              position: clampPoint(point(event.clientX, event.clientY), CORE_SIZE / 2 + 2),
            };
            commit({ ...board, pieces: [...board.pieces.filter((piece) => piece.id !== "core"), core] });

            return;
          }

          if (!Object.prototype.hasOwnProperty.call(STRIKER_METADATA, value)) {
            return;
          }

          const striker = STRIKER_METADATA[value as Striker];
          cancel();
          commit({
            ...board,
            pieces: [
              ...board.pieces,
              {
                id: crypto.randomUUID(),
                name: value,
                icon: striker.icon,
                team,
                position: clampPoint(point(event.clientX, event.clientY), PIECE_SIZE / 2 + 2),
              },
            ],
          });
        }}
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r="0.5" />
          </clipPath>
        </defs>
        {displayedMap && (
          <image
            href={displayedMap}
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
            preserveAspectRatio="xMidYMid meet"
            onError={onImageError}
          />
        )}
        {displayed.drawings.map((d) => (
          <g
            key={d.id}
            data-object={d.id}
            fill="none"
            stroke={d.color}
            strokeWidth={d.width}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline
              points={pointString(d.points)}
              stroke="transparent"
              strokeWidth={Math.max(16, d.width + 10)}
              pointerEvents="stroke"
            />
            <polyline points={pointString(d.points)} pointerEvents="none" />
            {d.kind === "arrow" && <polyline points={pointString(arrowHead(d))} />}
          </g>
        ))}
        {displayed.pieces.map((p) => {
          const size = p.id === "core" ? CORE_SIZE : PIECE_SIZE;

          return (
            <g
              key={p.id}
              data-object={p.id}
              transform={`translate(${p.position.x - size / 2} ${p.position.y - size / 2})`}
            >
              <title>
                {p.name}
                {p.team ? ` — ${p.team} team` : ""}
              </title>
              {p.id === "core" ? (
                <svg
                  width={size}
                  height={size}
                  viewBox={`${CORE_CROP.x} ${CORE_CROP.y} ${CORE_CROP.size} ${CORE_CROP.size}`}
                  overflow="hidden"
                >
                  <image href={p.icon} width={1920} height={1080} onError={onImageError} />
                </svg>
              ) : (
                <image href={p.icon} width={size} height={size} clipPath={`url(#${clipId})`} onError={onImageError} />
              )}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2}
                fill="transparent"
                stroke={p.team ? TEAM_COLORS[p.team] : "none"}
                strokeWidth={3}
              />
            </g>
          );
        })}
      </svg>
      {loading && <MapLoading />}
      {failed && (
        <div
          className="pointer-events-none absolute left-3 top-3 rounded-lg bg-tools-carbon/90 px-3 py-2 text-xs text-white/70"
          role="status"
        >
          Map could not be loaded
        </div>
      )}
    </div>
  );
}
