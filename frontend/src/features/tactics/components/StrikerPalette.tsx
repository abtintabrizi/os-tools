import { ALL_STRIKERS, Team } from "@/features/common/constants/constants";
import { DRAG_TYPE, TEAM_COLORS } from "../constants";
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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-center gap-2" aria-label="Striker palette">
        {ALL_STRIKERS.map((striker) => (
          <img
            key={striker.name}
            src={striker.icon}
            alt={striker.name}
            title={`Drag ${striker.name} onto the map (${team} team)`}
            draggable
            onError={onImageError}
            onDragStart={(event) => {
              event.dataTransfer.setData(DRAG_TYPE, striker.name);
              event.dataTransfer.effectAllowed = "copy";
            }}
            className="h-12 w-12 cursor-grab rounded-lg border-2 bg-tools-graphite transition-transform hover:scale-110"
            style={{ borderColor: TEAM_COLORS[team] }}
          />
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 text-sm">
        <span className="text-white/50">Place as</span>
        <div role="group" aria-label="Team for new strikers" className="flex gap-1 rounded-lg bg-tools-carbon p-1">
          {([Team.Blue, Team.Red] as const).map((value) => (
            <button
              key={value}
              aria-pressed={team === value}
              onClick={() => setTeam(value)}
              className={`rounded-md px-4 py-2 capitalize ${team === value ? "bg-white/10" : "text-white/40"}`}
              style={team === value ? { color: TEAM_COLORS[value] } : undefined}
            >
              {value} team
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
