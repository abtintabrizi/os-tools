import { DraftAction } from "@/features/map-drafter/types";

export default function DonePanel({
  picks,
  blueName,
}: {
  picks: DraftAction[];
  blueName: string;
}) {
  return (
    <div className="flex flex-col gap-3 py-2">
      {picks.map((pick, i) => {
        const isBlue = pick.team === blueName;
        const borderClass = isBlue
          ? "border-tools-blue/30"
          : "border-tools-red/30";
        const teamClass = isBlue ? "text-tools-blue" : "text-tools-red";

        return (
          <div
            key={i}
            className={`bg-tools-carbon border-2 ${borderClass} rounded-xl p-5 px-6 flex items-center justify-between`}
          >
            <div>
              <div className="font-mono tracking-widest uppercase mb-1">
                Game {i + 1}
              </div>
              <div className="text-xl font-bold">{pick.map}</div>
            </div>
            <div className={`text-lg font-mono tracking-widest ${teamClass}`}>
              {pick.team} pick
            </div>
          </div>
        );
      })}
    </div>
  );
}
