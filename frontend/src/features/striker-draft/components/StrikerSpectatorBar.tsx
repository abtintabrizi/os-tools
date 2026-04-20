import { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";

import {
  ALL_STRIKERS,
  ALL_MAPS,
  ALL_AWAKENINGS,
  DraftAction,
  Team,
} from "@/features/common/constants/constants";
import type { StrikerDraftAction } from "@/features/striker-draft/types";
import { useStrikerDraftContext } from "@/features/striker-draft/context/StrikerDraftContext";
import { STRIKER_SEQUENCE } from "@/features/striker-draft/constants";

interface StrikerCardProps {
  completedAction: StrikerDraftAction | undefined;
  isBan: boolean;
  isBlue: boolean;
  teamName: string;
  isCurrent: boolean;
  timeLeft: number;
}

function StrikerCard({
  completedAction,
  isBan,
  isBlue,
  teamName,
  isCurrent,
  timeLeft,
}: StrikerCardProps) {
  const wasFilledOnMount = useRef(!!completedAction);
  const strikerEntry = completedAction?.striker
    ? ALL_STRIKERS.find((s) => s.name === completedAction.striker)
    : null;
  const isNoBan = !!completedAction && !completedAction.striker;

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
          {strikerEntry && (
            <motion.div
              key={strikerEntry.name}
              className="absolute inset-0"
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.65, ease: [0.25, 0, 0, 1] }}
            >
              <motion.img
                src={strikerEntry.icon}
                alt={completedAction?.striker}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%)" }}
                initial={{ x: "12%", y: "-12%" }}
                animate={{ x: 0, y: 0 }}
                transition={{ duration: 0.65, ease: [0.25, 0, 0, 1] }}
              />
              <motion.img
                src={strikerEntry.icon}
                alt={completedAction?.striker}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ clipPath: "polygon(0% 0%, 0% 100%, 100% 100%)" }}
                initial={{ x: "-12%", y: "12%" }}
                animate={{ x: 1, y: -1 }}
                transition={{ duration: 0.65, ease: [0.25, 0, 0, 1] }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {completedAction && !wasFilledOnMount.current && !isNoBan && (
          <motion.div
            key={completedAction.striker}
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
        {isBan && completedAction && !isNoBan && (
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
        {isNoBan && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: wasFilledOnMount.current ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-[9px] font-bold tracking-widest uppercase bg-white/10 text-white/50 px-1 py-0.5 rounded">
                No Ban
              </span>
            </div>
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
        {completedAction
          ? (completedAction.striker ?? "No Ban")
          : isBan
            ? "Ban"
            : "Pick"}
      </span>
    </div>
  );
}

interface StrikerSpectatorBarProps {
  timeLeft: number;
  countdownLeft: number;
}

export function StrikerSpectatorBar({
  timeLeft,
  countdownLeft,
}: StrikerSpectatorBarProps) {
  const { state } = useStrikerDraftContext();
  if (!state) return null;

  const {
    step,
    done,
    actions,
    blueName,
    redName,
    readyBlue,
    readyRed,
    map,
    awakenings,
  } = state;
  const bothReady = readyBlue && readyRed;

  const mapEntry = ALL_MAPS.find((m) => m.name === map);

  const blueBadgeClass = "bg-tools-blue-dim text-tools-blue";
  const redBadgeClass = "bg-tools-red-dim text-tools-red";

  return (
    <div className="px-5 mx-5 border-t border-white/7 h-40 flex items-center gap-5 shrink-0 justify-center">
      <div className="flex items-center gap-4 shrink-0">
        {mapEntry && (
          <div className="w-20 flex flex-col items-center gap-1">
            <img
              src={mapEntry.icon}
              alt={map}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <span className="font-mono text-[10px] font-semibold text-white/60 text-center w-full line-clamp-2 leading-tight">
              {map}
            </span>
          </div>
        )}
        {mapEntry && awakenings.length > 0 && (
          <div className="w-px h-12 bg-white/10" />
        )}
        {awakenings.map((aw) => {
          const awEntry = ALL_AWAKENINGS.find((a) => a.name === aw);
          return awEntry ? (
            <div key={aw} className="w-20 flex flex-col items-center gap-1">
              <img
                src={awEntry.icon}
                alt={aw}
                className="w-16 h-16 object-contain"
              />
              <span className="font-mono text-[10px] text-white/50 text-center w-full line-clamp-2 leading-tight">
                {aw}
              </span>
            </div>
          ) : null;
        })}
      </div>
      <div className="w-px bg-white/7 h-3/5" />
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
        <div className="flex gap-2">
          {STRIKER_SEQUENCE.map((s, i) => {
            const completedAction = actions[i];
            const isBlue = s.team === Team.Blue;
            const isBan = s.action === DraftAction.Ban;
            const teamName = isBlue ? blueName : redName;
            const isCurrent = !done && i === step;

            return (
              <StrikerCard
                key={i}
                completedAction={completedAction}
                isBan={isBan}
                isBlue={isBlue}
                teamName={teamName}
                isCurrent={isCurrent}
                timeLeft={timeLeft}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
