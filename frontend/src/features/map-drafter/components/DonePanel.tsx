import { DraftAction } from "@/features/map-drafter/types";
import { ALL_MAPS } from "@/common/constants";

export default function DonePanel({
  actions,
  blueName,
}: {
  actions: DraftAction[];
  blueName: string;
}) {
  const picks = actions.filter((a) => a.action === "pick" && a.team !== null);
  const decider = actions.find((a) => a.action === "pick" && a.team === null);
  const deciderImage = decider
    ? ALL_MAPS.find((m) => m.name === decider.map)?.image
    : null;

  return (
    <div className="flex flex-row flex-wrap justify-center gap-3 py-2">
      {picks.map((pick, i) => {
        const isBlue = pick.team === blueName;
        const borderClass = isBlue
          ? "border-tools-blue/40"
          : "border-tools-red/40";
        const teamClass = isBlue ? "text-tools-blue" : "text-tools-red";
        const image = ALL_MAPS.find((m) => m.name === pick.map)?.image;

        return (
          <div
            key={i}
            className={`relative w-[calc(33.333%-0.5rem)] border-2 ${borderClass} rounded-xl overflow-hidden aspect-video`}
          >
            {image && (
              <img
                src={image}
                alt={pick.map}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="font-mono tracking-widest uppercase text-white/60">
                Game {i + 1}
              </div>
              <div className="font-bold leading-tight">{pick.map}</div>
              <div className={`font-mono tracking-widest ${teamClass}`}>
                {pick.team}
              </div>
            </div>
          </div>
        );
      })}
      {decider && (
        <div className="relative w-[calc(33.333%-0.5rem)] border-2 border-tools-gold/50 rounded-xl overflow-hidden aspect-video">
          {deciderImage && (
            <img
              src={deciderImage}
              alt={decider.map}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="font-mono tracking-widest uppercase text-tools-gold/80">
              Game 3 · Decider
            </div>
            <div className="font-bold leading-tight">{decider.map}</div>
          </div>
        </div>
      )}
    </div>
  );
}
