import { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";

import {
  ALL_MAPS,
  DraftAction,
  Team,
} from "@/features/common/constants/constants";
import { Sequence } from "@/features/map-drafter/types";
import type { MapDraftAction } from "@/features/map-drafter/types";
import { useMapDraftContext } from "@/features/map-drafter/context/MapDraftContext";
import { SEQUENCE_MAP } from "@map-drafter/constants.ts";
import { deriveMapStatuses } from "@/features/map-drafter/utils";

interface SequenceStep {
  team: Team;
  action: DraftAction;
  gameNum?: number;
}

interface SpectatorCardProps {
  completedAction: MapDraftAction | undefined;
  isBan: boolean;
  isBlue: boolean;
  teamName: string;
  isCurrent: boolean;
  pickNumber: number | null;
  timeLeft: number;
}

function SpectatorCard({
  completedAction,
  isBan,
  isBlue,
  teamName,
  isCurrent,
  pickNumber,
  timeLeft,
}: SpectatorCardProps) {
  const wasFilledOnMount = useRef(!!completedAction);
  const mapEntry = completedAction
    ? ALL_MAPS.find((m) => m.name === completedAction.map)
    : null;

  return (
    <div className="flex flex-col items-center gap-1 w-20">
      <span
        className={`font-mono font-bold tracking-widest uppercase text-center truncate w-full ${isBlue ? "text-tools-blue" : "text-tools-red"}`}
      >
        {teamName}
      </span>
      <div
        className={`relative w-20 h-20 rounded border-2 overflow-hidden ${isBlue ? "border-tools-blue" : "border-tools-red"} ${isCurrent ? "ring-1 ring-white/30" : ""} ${!completedAction && !isCurrent ? "opacity-30" : ""}`}
      >
        <div className="absolute inset-0 bg-white/5" />
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
                src={mapEntry.icon}
                alt={completedAction?.map}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%)" }}
                initial={{ x: "12%", y: "-12%" }}
                animate={{ x: 0, y: 0 }}
                transition={{ duration: 0.65, ease: [0.25, 0, 0, 1] }}
              />
              <motion.img
                src={mapEntry.icon}
                alt={completedAction?.map}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ clipPath: "polygon(0% 0%, 0% 100%, 100% 100%)" }}
                initial={{ x: "-12%", y: "12%" }}
                animate={{ x: 1, y: -1 }}
                transition={{ duration: 0.65, ease: [0.25, 0, 0, 1] }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {completedAction && !wasFilledOnMount.current && (
          <motion.div
            key={completedAction.map}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isBan
                ? "rgba(239,68,68,0.2)"
                : "rgba(34,197,94,0.15)",
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        )}
        {isBan && completedAction && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: wasFilledOnMount.current ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/50 grayscale" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-[9px] font-bold tracking-widest uppercase bg-tools-red/50 text-white px-1 py-0.5 rounded">
                Banned
              </span>
            </div>
          </motion.div>
        )}
        {!isBan && completedAction && pickNumber && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: wasFilledOnMount.current ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: wasFilledOnMount.current ? 0 : 0.4,
              duration: 0.2,
            }}
          >
            <span className="font-mono text-sm font-bold tracking-widest uppercase bg-tools-gold/70 text-black px-2 py-0.5 rounded">
              G{pickNumber}
            </span>
          </motion.div>
        )}
        {isCurrent && !completedAction && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`font-mono font-bold tabular-nums text-2xl ${
                timeLeft <= 5
                  ? "text-tools-red"
                  : timeLeft <= 10
                    ? "text-amber-400"
                    : "text-white/70"
              }`}
            >
              {timeLeft}
            </span>
          </div>
        )}
      </div>
      <span className="font-mono text-xs text-white/40 text-center leading-tight w-20 line-clamp-2 min-h-7.5">
        {completedAction?.map ?? (isBan ? "Ban" : `G${pickNumber}`)}
      </span>
    </div>
  );
}

function DeciderCard({ mapName }: { mapName: string | undefined }) {
  const wasFilledOnMount = useRef(!!mapName);
  const mapEntry = mapName ? ALL_MAPS.find((m) => m.name === mapName) : null;

  return (
    <div className="flex flex-col items-center gap-1 w-20">
      <span className="font-mono font-bold tracking-widest uppercase text-center text-tools-gold">
        Decider
      </span>
      <div
        className={`relative w-20 h-20 rounded border-2 overflow-hidden border-tools-gold ${!mapName ? "opacity-30" : ""}`}
      >
        <div className="absolute inset-0 bg-white/5" />
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
                src={mapEntry.icon}
                alt={mapName}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%)" }}
                initial={{ x: "12%", y: "-12%" }}
                animate={{ x: 0, y: 0 }}
                transition={{ duration: 0.65, ease: [0.25, 0, 0, 1] }}
              />
              <motion.img
                src={mapEntry.icon}
                alt={mapName}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ clipPath: "polygon(0% 0%, 0% 100%, 100% 100%)" }}
                initial={{ x: "-12%", y: "12%" }}
                animate={{ x: 1, y: -1 }}
                transition={{ duration: 0.65, ease: [0.25, 0, 0, 1] }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {mapName && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: wasFilledOnMount.current ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: wasFilledOnMount.current ? 0 : 0.4,
              duration: 0.2,
            }}
          >
            <span className="font-mono text-sm font-bold tracking-widest uppercase bg-tools-gold/70 text-black px-2 py-0.5 rounded">
              G3
            </span>
          </motion.div>
        )}
      </div>
      <span className="font-mono text-xs text-white/40 text-center leading-tight w-20 line-clamp-2 min-h-7.5">
        {mapName ?? "G3"}
      </span>
    </div>
  );
}

interface SpectatorBarProps {
  timeLeft: number;
  countdownLeft: number;
}

export function SpectatorBar({ timeLeft, countdownLeft }: SpectatorBarProps) {
  const { state } = useMapDraftContext();
  if (!state) return null;

  const { step, done, actions, blueName, redName, readyBlue, readyRed } = state;
  const sequence: SequenceStep[] = SEQUENCE_MAP[state.bestOf];
  const bothReady = readyBlue && readyRed;
  const mapStatuses = deriveMapStatuses(state, sequence);

  const blueBadgeClass = "bg-tools-blue-dim text-tools-blue";
  const redBadgeClass = "bg-tools-red-dim text-tools-red";

  const deciderMap = Object.entries(mapStatuses).find(
    ([, s]) => s === "decider",
  )?.[0];

  return (
    <div className="px-5 border-t border-white/7 h-40 flex items-center gap-5 shrink-0 justify-center">
      {!bothReady ? (
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2 w-26">
            <span
              className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${blueBadgeClass}`}
            >
              Blue
            </span>
            <span className="font-mono text-sm font-bold max-w-full truncate">
              {blueName}
            </span>
            {readyBlue ? (
              <span className="font-mono text-xs tracking-widest uppercase text-tools-green-light bg-tools-green/10 px-3 py-1 rounded border border-tools-green/20">
                Ready
              </span>
            ) : (
              <span className="font-mono text-xs tracking-widest uppercase text-white/25 px-3 py-1">
                Not ready
              </span>
            )}
          </div>
          <div className="w-px bg-white/7 self-stretch" />
          <div className="flex flex-col items-center gap-2 w-26">
            <span
              className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${redBadgeClass}`}
            >
              Red
            </span>
            <span className="font-mono text-sm font-bold max-w-full truncate">
              {redName}
            </span>
            {readyRed ? (
              <span className="font-mono text-xs tracking-widest uppercase text-tools-green-light bg-tools-green/10 px-3 py-1 rounded border border-tools-green/20">
                Ready
              </span>
            ) : (
              <span className="font-mono text-xs tracking-widest uppercase text-white/25 px-3 py-1">
                Not ready
              </span>
            )}
          </div>
        </div>
      ) : countdownLeft > 0 && actions.length === 0 ? (
        <span className="font-mono text-sm tracking-widest text-white/50">
          Starting in{" "}
          <strong className="text-tools-gold">{countdownLeft}</strong>
        </span>
      ) : (
        <div className="flex gap-3 justify-center">
          {sequence.map((s, i) => {
            const completedAction = actions[i];
            const isBlue = s.team === Team.Blue;
            const isBan = s.action === DraftAction.Ban;
            const teamName = isBlue ? blueName : redName;
            const isCurrent = !done && i === step;
            const pickNumber = !isBan ? (sequence[i].gameNum ?? 1) : null;

            return (
              <SpectatorCard
                key={i}
                completedAction={completedAction}
                isBan={isBan}
                isBlue={isBlue}
                teamName={teamName}
                isCurrent={isCurrent}
                pickNumber={pickNumber}
                timeLeft={timeLeft}
              />
            );
          })}
          {(state.bestOf === Sequence.BO3 ||
            state.bestOf === Sequence.BO3EU) && (
            <DeciderCard mapName={deciderMap} />
          )}
        </div>
      )}
    </div>
  );
}
