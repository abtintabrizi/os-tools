import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";

interface ReplayControlsProps {
  playing: boolean;
  onTogglePlaying: () => void;
  onRestart: () => void;
  onPreviousAction: () => void;
  onNextAction: () => void;
  hasPreviousAction: boolean;
  hasNextAction: boolean;
}

export function ReplayControls({
  playing,
  onTogglePlaying,
  onRestart,
  onPreviousAction,
  onNextAction,
  hasPreviousAction,
  hasNextAction,
}: ReplayControlsProps) {
  const buttonClass =
    "flex items-center gap-1.5 font-mono text-xs tracking-widest uppercase px-3 py-1.5 rounded border border-white/15 text-white/70 hover:border-white/30 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/15 disabled:hover:text-white/70";

  return (
    <div className="px-5 py-2 flex items-center justify-center gap-2 shrink-0">
      <span className="font-mono text-xs tracking-widest uppercase text-tools-gold mr-2">
        Replay
      </span>
      <button type="button" onClick={onRestart} className={buttonClass}>
        <RotateCcw size={14} /> Restart
      </button>
      <button
        type="button"
        onClick={onPreviousAction}
        disabled={!hasPreviousAction}
        className={buttonClass}
      >
        <SkipBack size={14} /> Previous
      </button>
      <button
        type="button"
        onClick={onTogglePlaying}
        className={`${buttonClass} w-24 justify-center border-tools-gold/40 text-tools-gold`}
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
        {playing ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        onClick={onNextAction}
        disabled={!hasNextAction}
        className={buttonClass}
      >
        <SkipForward size={14} /> Next
      </button>
    </div>
  );
}
