import { Check, X } from "lucide-react";
import {
  ALL_MAPS,
  ALL_STRIKERS,
  DraftAction,
  Team,
} from "@/features/common/constants/constants";
import type { ReplayEvent } from "@/features/common/types";

interface TimelineAction {
  step: number | null;
  team: Team | null;
  action: string;
}

interface ReplayTimelineProps {
  events: ReplayEvent[];
  actions: TimelineAction[];
  elapsedMs: number;
  durationMs: number;
}

export function ReplayTimeline({
  events,
  actions,
  elapsedMs,
  durationMs,
}: ReplayTimelineProps) {
  if (durationMs <= 0) return null;

  function actionForEvent(event: ReplayEvent, eventIndex: number): TimelineAction | undefined {
    if (event.type === "action") {
      return actions.find((action) => action.step === event.step);
    }
    const confirmation = events.slice(eventIndex).find(
      (candidate) =>
        candidate.type === "action" &&
        candidate.side === event.side &&
        candidate.atMs >= event.atMs,
    );
    return confirmation?.type === "action"
      ? actions.find((action) => action.step === confirmation.step)
      : undefined;
  }

  const playhead = Math.min(100, Math.max(0, (elapsedMs / durationMs) * 100));

  return (
    <div className="border-t border-white/7 px-8 pt-4 pb-2 shrink-0">
      <div className="relative h-7 mx-auto max-w-5xl">
        <div className="absolute left-0 right-0 top-3.5 h-px bg-white/20" />
        {events.map((event, index) => {
          const draftAction = actionForEvent(event, index);
          if (!draftAction) return null;
          const isBan = draftAction.action === DraftAction.Ban;
          const isPending = event.type === "pending";
          const left = Math.min(100, Math.max(0, (event.atMs / durationMs) * 100));
          const color = event.side === Team.Blue ? "text-tools-blue" : "text-tools-red";
          const Icon = isBan ? X : Check;
          const entry = event.value
            ? ALL_MAPS.find((item) => item.name === event.value) ??
              ALL_STRIKERS.find((item) => item.name === event.value)
            : undefined;
          const entryIcon = entry?.icon;
          const entryName = event.value ?? "No Ban";

          return (
            <span
              key={`${event.type}-${event.atMs}-${index}`}
              className={`group absolute top-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-tools-void hover:z-30 ${color} ${isPending ? "opacity-50 hover:opacity-100" : "z-10"}`}
              style={{ left: `${left}%` }}
            >
              <Icon size={isPending ? 10 : 15} strokeWidth={isPending ? 2 : 3} />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden w-max -translate-x-1/2 items-center gap-2 rounded-lg border border-white/10 bg-tools-carbon px-2.5 py-2 text-left shadow-xl group-hover:flex">
                {entryIcon ? (
                  <img
                    src={entryIcon}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded object-cover"
                  />
                ) : null}
                <span className="flex flex-col">
                  <span className="whitespace-nowrap text-xs font-semibold leading-tight text-white">
                    {entryName}
                  </span>
                  <span className={`font-mono text-[10px] uppercase tracking-widest ${color}`}>
                    {isPending ? "Pending " : ""}
                    {isBan ? "Ban" : "Pick"}
                  </span>
                </span>
              </span>
            </span>
          );
        })}
        <div
          className="absolute top-0 bottom-0 w-px bg-tools-gold z-20 shadow-[0_0_6px_rgba(255,215,0,0.7)] transition-[left] duration-100 ease-linear"
          style={{ left: `${playhead}%` }}
        />
      </div>
    </div>
  );
}
