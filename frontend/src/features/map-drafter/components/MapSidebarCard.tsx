import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";

import { ALL_MAPS, DraftAction } from "@/features/common/constants/constants";
import type { MapDraftAction } from "@/features/map-drafter/types";

interface SequenceStep {
  team: string;
  action: DraftAction;
  globalIdx: number;
  gameNum?: number;
}

interface MapSidebarCardProps {
  step: SequenceStep;
  cardIndex: number;
  teamActions: MapDraftAction[];
  teamSteps: SequenceStep[];
  isBlue: boolean;
  currentStep: number;
  done: boolean;
  timeLeft: number;
  bothReady: boolean;
  pendingMap?: string | null;
}

export function MapSidebarCard({
  step: s,
  cardIndex,
  teamActions,
  teamSteps,
  isBlue,
  currentStep,
  done,
  timeLeft,
  bothReady,
  pendingMap,
}: MapSidebarCardProps) {
  const filled = teamActions[cardIndex];
  const wasFilledOnMount = useRef(!!filled);
  const isBan = s.action === DraftAction.Ban;
  const isActive = s.globalIdx === currentStep && !done;
  const status: "filled" | "active" | "pending" = filled
    ? "filled"
    : isActive
      ? "active"
      : "pending";

  const mapEntry = filled?.map
    ? ALL_MAPS.find((m) => m.name === filled.map)
    : null;
  const pendingEntry =
    status === "active" && pendingMap
      ? ALL_MAPS.find((m) => m.name === pendingMap)
      : null;

  const nth =
    teamSteps.slice(0, cardIndex).filter((t) => t.action === s.action).length +
    1;
  const label = isBan ? `Ban ${nth}` : `Pick ${s.gameNum ?? nth}`;

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
      className={`relative rounded-lg border-2 overflow-hidden aspect-video ${borderClass} ${status === "pending" ? "opacity-30" : ""}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: isBlue
            ? "radial-gradient(circle at 50% 65%, rgba(59,130,246,0.15) 0%, rgba(18,18,28,1) 75%)"
            : "radial-gradient(circle at 50% 65%, rgba(239,68,68,0.15) 0%, rgba(18,18,28,1) 75%)",
        }}
      />
      <AnimatePresence initial={false}>
        {mapEntry && (
          <motion.div
            key={mapEntry.name}
            className="absolute inset-0"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.65, ease: [0.25, 0, 0, 1] }}
          >
            <motion.img
              src={mapEntry.image}
              alt={filled?.map}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                clipPath: "polygon(-2% -2%, 102% -2%, 102% 106%, -2% 2%)",
              }}
              initial={{ x: "12%", y: "-12%" }}
              animate={{ x: 0, y: -1 }}
              transition={{ duration: 0.65, ease: [0.25, 0, 0, 1] }}
            />
            <motion.img
              src={mapEntry.image}
              alt={filled?.map}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ clipPath: "polygon(-2% -2%, -2% 102%, 102% 102%)" }}
              initial={{ x: "-12%", y: "12%" }}
              animate={{ x: 0, y: -2 }}
              transition={{ duration: 0.65, ease: [0.25, 0, 0, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {pendingEntry && (
          <motion.img
            key={pendingEntry.name}
            src={pendingEntry.image}
            alt={pendingEntry.name}
            className="absolute inset-0 w-full h-full object-cover blur-[2px] brightness-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent" />
      {filled && !wasFilledOnMount.current && (
        <motion.div
          key={filled.map}
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
      {isBan && filled && (
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
      <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-end gap-1">
        {filled && (
          <span
            className={`text-xl font-bold leading-tight truncate ${isBan ? "line-through text-white/50" : "text-white"}`}
          >
            {filled.map}
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
