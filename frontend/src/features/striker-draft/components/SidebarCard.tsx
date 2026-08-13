import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import {
  ALL_STRIKERS,
  DraftAction,
  StrikerDirection,
  Team,
} from "@/features/common/constants/constants";
import { AnimatedNumber } from "@/features/common/components/AnimatedNumber";
import type {
  StrikerDraftAction,
  StrikerDraftState,
  IndexedStep,
} from "@/features/striker-draft/types";
import { useStrikerColor } from "@/features/striker-draft/hooks/useStrikerColor";
import { STRIKER_SEQUENCE } from "@/features/striker-draft/constants";

interface SidebarCardProps {
  step: IndexedStep;
  cardIndex: number;
  isBlue: boolean;
  timeLeft: number;
  state: StrikerDraftState;
}

export function SidebarCard({
  step: s,
  cardIndex,
  isBlue,
  timeLeft,
  state,
}: SidebarCardProps) {
  const teamSteps: IndexedStep[] = STRIKER_SEQUENCE.map((step, i) => ({
    ...step,
    globalIdx: i,
  })).filter((step) => step.team === (isBlue ? Team.Blue : Team.Red));
  const teamActions: StrikerDraftAction[] = state.actions.filter((a) => a.team === (isBlue ? Team.Blue : Team.Red));
  const pendingStriker = isBlue ? state.pendingBlue : state.pendingRed;
  const currentStep = state.step;
  const done = state.done;
  const bothReady = state.readyBlue && state.readyRed;

  const filled = teamActions[cardIndex];
  const wasFilledOnMount = useRef(!!filled);
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

  const shouldFlip = strikerEntry
    ? (isBlue && strikerEntry.facing === StrikerDirection.Left) ||
      (!isBlue && strikerEntry.facing === StrikerDirection.Right)
    : false;
  const pendingShouldFlip = pendingEntry
    ? (isBlue && pendingEntry.facing === StrikerDirection.Left) ||
      (!isBlue && pendingEntry.facing === StrikerDirection.Right)
    : false;

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
      {splashColor ? (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 30%, rgba(${splashColor},0.7) 0%, transparent 85%)`,
          }}
        />
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
      <div className={`absolute inset-0 ${shouldFlip ? "scale-x-[-1]" : ""}`}>
        <AnimatePresence initial={false}>
          {strikerEntry && (
            <motion.div
              key={strikerEntry.name}
              className="absolute inset-0"
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.65, ease: [0.25, 0, 0, 1] }}
            >
              <motion.img
                src={strikerEntry.splash}
                alt={filled?.striker}
                className="absolute inset-0 w-full h-full object-cover object-top"
                style={{
                  clipPath: "polygon(-2% -2%, 102% -2%, 102% 106%, -2% 2%)",
                }}
                initial={{ x: "12%", y: "-12%" }}
                animate={{ x: 0, y: -1 }}
                transition={{ duration: 0.65, ease: [0.25, 0, 0, 1] }}
              />
              <motion.img
                src={strikerEntry.splash}
                alt={filled?.striker}
                className="absolute inset-0 w-full h-full object-cover object-top"
                style={{ clipPath: "polygon(-2% -2%, -2% 102%, 102% 102%)" }}
                initial={{ x: "-12%", y: "12%" }}
                animate={{ x: 0, y: -1 }}
                transition={{ duration: 0.65, ease: [0.25, 0, 0, 1] }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {pendingEntry && (
          <motion.img
            key={pendingEntry.name}
            src={pendingEntry.splash}
            alt={pendingEntry.name}
            className={`absolute inset-0 w-full h-full object-cover object-top blur-[2px] brightness-50 ${pendingShouldFlip ? "scale-x-[-1]" : ""}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent" />
      {filled && !wasFilledOnMount.current && !isNoBan && (
        <motion.div
          key={filled.striker}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isBan ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.15)",
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      )}
      {status === "active" && bothReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatedNumber
            value={timeLeft}
            className={`font-mono font-bold tabular-nums text-4xl ${
              timeLeft <= 5
                ? "text-tools-red"
                : timeLeft <= 10
                  ? "text-amber-400"
                  : "text-white"
            }`}
          />
        </div>
      )}
      {isBan && filled && !isNoBan && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: wasFilledOnMount.current ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/50 grayscale" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-sm font-bold tracking-widest uppercase bg-tools-red/20 text-tools-red-light px-2.5 py-1 rounded">
              Banned
            </span>
          </div>
        </motion.div>
      )}
      {isNoBan && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: wasFilledOnMount.current ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <span className="font-mono text-base font-bold tracking-widest uppercase italic">
            No Ban
          </span>
        </motion.div>
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
