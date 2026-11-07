import { Striker, Team } from "@os-tools/shared";
import { useEffect, useRef, useState } from "react";

import { STRIKER_METADATA } from "../../common/constants/constants";
import { CORE_CROP, DRAG_TYPE, TEAM_COLORS } from "../constants";
import type { PlayingTeam } from "../types";

export default function StrikerPalette({
  team,
  setTeam,
  onImageError,
}: {
  team: PlayingTeam;
  setTeam: (team: PlayingTeam) => void;
  onImageError: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLDivElement>(null);
  const [capacity, setCapacity] = useState(11);

  useEffect(() => {
    const element = container.current;
    const toggleElement = toggle.current;
    if (!element || !toggleElement) {
      return;
    }

    const observer = new ResizeObserver(() => {
      // Icons are 64px wide, with an 8px gap between them.
      const availableWidth = element.clientWidth - toggleElement.getBoundingClientRect().width - 16;
      setCapacity(Math.max(1, Math.floor((availableWidth + 8) / 72)));
    });
    observer.observe(element);
    observer.observe(toggleElement);

    return () => observer.disconnect();
  }, []);

  const icons = [
    <div
      key="core"
      draggable
      role="img"
      aria-label="Core"
      title="Drag core onto the map"
      className="h-16 w-16 cursor-grab overflow-hidden rounded-full border-2 border-tools-gold bg-tools-graphite transition-transform hover:scale-110"
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_TYPE, "core");
        event.dataTransfer.effectAllowed = "copy";
      }}
    >
      <svg
        className="pointer-events-none h-full w-full"
        viewBox={`${CORE_CROP.x} ${CORE_CROP.y} ${CORE_CROP.size} ${CORE_CROP.size}`}
        aria-hidden="true"
      >
        <image href="/other/Core.png" width={1920} height={1080} onError={onImageError} />
      </svg>
    </div>,
    ...Object.values(Striker)
      .sort((a, b) => {
        return a.localeCompare(b);
      })
      .map((name) => (
        <img
          key={name}
          src={STRIKER_METADATA[name].icon}
          alt={name}
          title={`Drag ${name} onto the map (${team} team)`}
          draggable
          onError={onImageError}
          onDragStart={(event) => {
            event.dataTransfer.setData(DRAG_TYPE, name);
            event.dataTransfer.effectAllowed = "copy";
          }}
          className="h-16 w-16 cursor-grab rounded-full border-2 bg-tools-graphite object-cover transition-transform hover:scale-110"
          style={{ borderColor: TEAM_COLORS[team] }}
        />
      )),
  ];
  const rowCount = Math.ceil(icons.length / capacity);
  const baseSize = Math.floor(icons.length / rowCount);
  const remainder = icons.length % rowCount;
  const rows = Array.from({ length: rowCount }, (_, index) => {
    const start = index * baseSize + Math.min(index, remainder);
    const size = baseSize + (index < remainder ? 1 : 0);

    return icons.slice(start, start + size);
  });

  return (
    <div ref={container} className="flex items-center justify-center gap-4">
      <div
        className="flex min-w-0 flex-col gap-2"
        style={{ width: Math.ceil(icons.length / rowCount) * 72 - 8 }}
        aria-label="Piece palette"
      >
        {rows.map((row, index) => (
          <div key={index} className="flex justify-center gap-2">
            {row}
          </div>
        ))}
      </div>
      <div ref={toggle} className="flex shrink-0 items-center gap-2 text-xs font-semibold">
        <span className={team === Team.Blue ? "text-tools-blue" : "text-white/40"}>Blue</span>
        <button
          type="button"
          role="switch"
          aria-label="Red team for new strikers"
          aria-checked={team === Team.Red}
          title={`New strikers: ${team} team`}
          onClick={() => setTeam(team === Team.Blue ? Team.Red : Team.Blue)}
          className={`relative h-8 w-14 rounded-full border border-white/15 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${team === Team.Red ? "bg-tools-red" : "bg-tools-blue"}`}
        >
          <span
            className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${team === Team.Red ? "translate-x-6" : "translate-x-0"}`}
          />
        </button>
        <span className={team === Team.Red ? "text-tools-red" : "text-white/40"}>Red</span>
      </div>
    </div>
  );
}
