import {
  ALL_STRIKERS,
  DraftAction,
  StrikerDirection,
} from "@/features/common/constants/constants";
import type {
  StrikerDraftAction,
  IndexedStep,
} from "@/features/striker-draft/types";
import { useStrikerColor } from "@/features/striker-draft/hooks/useStrikerColor";

interface SidebarCardProps {
  step: IndexedStep;
  cardIndex: number;
  teamActions: StrikerDraftAction[];
  teamSteps: IndexedStep[];
  isBlue: boolean;
  currentStep: number;
  done: boolean;
  timeLeft: number;
  bothReady: boolean;
  pendingStriker?: string | null;
}

export function SidebarCard({
  step: s,
  cardIndex,
  teamActions,
  teamSteps,
  isBlue,
  currentStep,
  done,
  timeLeft,
  bothReady,
  pendingStriker,
}: SidebarCardProps) {
  const filled = teamActions[cardIndex];
  const isBan = s.action === DraftAction.Ban;
  const isActive = s.globalIdx === currentStep && !done;
  const status: "filled" | "active" | "pending" = filled
    ? "filled"
    : isActive
      ? "active"
      : "pending";
  const isNoBan = filled ? filled.striker === null : false;
  const strikerEntry =
    filled && filled.striker
      ? ALL_STRIKERS.find((str) => str.name === filled.striker)
      : null;
  const pendingEntry =
    status === "active" && pendingStriker
      ? ALL_STRIKERS.find((str) => str.name === pendingStriker)
      : null;
  const splashColor = useStrikerColor(strikerEntry?.splash);

  const nth =
    teamSteps.slice(0, cardIndex).filter((t) => t.action === s.action).length +
    1;
  const label = isBan ? `Ban ${nth}` : `Pick ${nth}`;

  const borderClass =
    status === "filled"
      ? isBan
        ? "border-tools-red/25"
        : "border-tools-green/25"
      : status === "active"
        ? isBan
          ? "border-tools-red/50 animate-[pulseBorder_2s_infinite]"
          : "border-tools-green/50 animate-[pulseBorder_2s_infinite]"
        : "border-white/7";

  return (
    <div
      className={`relative rounded-lg border-2 overflow-hidden flex-1 min-h-0 ${borderClass} ${status === "pending" ? "opacity-30" : ""}`}
    >
      {strikerEntry ? (
        <>
          {splashColor && (
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 30%, rgba(${splashColor},0.7) 0%, transparent 85%)`,
              }}
            />
          )}
          <img
            src={strikerEntry.splash}
            alt={filled?.striker}
            className={`absolute inset-0 w-full h-full object-cover object-top ${
              (isBlue && strikerEntry.facing === StrikerDirection.Left) ||
              (!isBlue && strikerEntry.facing === StrikerDirection.Right)
                ? "scale-x-[-1]"
                : ""
            }`}
          />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: isBlue
              ? "radial-gradient(circle at 50% 65%, rgba(59,130,246,0.15) 0%, rgba(18,18,28,1) 75%)"
              : "radial-gradient(circle at 50% 65%, rgba(239,68,68,0.15) 0%, rgba(18,18,28,1) 75%)",
          }}
        />
      )}
      {pendingEntry && (
        <img
          src={pendingEntry.splash}
          alt={pendingEntry.name}
          className={`absolute inset-0 w-full h-full object-cover object-top blur-sm brightness-50 transition-opacity duration-300 ${
            (isBlue && pendingEntry.facing === StrikerDirection.Left) ||
            (!isBlue && pendingEntry.facing === StrikerDirection.Right)
              ? "scale-x-[-1]"
              : ""
          }`}
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent" />
      {status === "active" && bothReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-mono font-bold tabular-nums text-4xl ${
              timeLeft <= 5
                ? "text-tools-red"
                : timeLeft <= 10
                  ? "text-amber-400"
                  : "text-white"
            }`}
          >
            {timeLeft}
          </span>
        </div>
      )}
      {isBan && filled && !isNoBan && (
        <>
          <div className="absolute inset-0 bg-black/50 grayscale" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-sm font-bold tracking-widest uppercase bg-tools-red/20 text-tools-red-light px-2.5 py-1 rounded">
              Banned
            </span>
          </div>
        </>
      )}
      {isNoBan && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-base font-bold tracking-widest uppercase italic">
            No Ban
          </span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-end gap-1">
        {filled && !isNoBan && (
          <span
            className={`text-xl font-bold leading-tight truncate ${isBan ? "line-through text-white/50" : "text-white"}`}
          >
            {filled.striker}
          </span>
        )}
        <span
          className={`text-lg font-mono tracking-widest uppercase ml-auto shrink-0 ${isBan ? "text-tools-red-light/70" : "text-tools-green-light/70"}`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
