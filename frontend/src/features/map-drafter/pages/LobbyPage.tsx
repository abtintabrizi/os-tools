import { useState } from "react";
import type { DraftState, Side } from "@map-drafter/types";

interface Props {
  state: DraftState;
  onEnter: (side: Side) => void;
}

function buildUrl(roomId: string, side: Side): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("room", roomId);
  url.searchParams.set("side", side);
  return url.toString();
}

export default function LobbyPage({ state, onEnter }: Props) {
  const [copied, setCopied] = useState<Side | null>(null);

  const blueUrl = buildUrl(state.roomId, "blue");
  const redUrl = buildUrl(state.roomId, "red");

  async function copy(url: string, side: Side) {
    await navigator.clipboard.writeText(url);
    setCopied(side);
    setTimeout(() => setCopied(null), 2000);
  }

  const baseBtn = "px-2.5 py-2.5 rounded-lg font-head text-[13px] font-bold transition-all duration-150";
  const blueBtn = "border border-[rgba(59,130,246,0.35)] text-(--blue) bg-[rgba(59,130,246,0.06)] hover:bg-[rgba(59,130,246,0.14)]";
  const redBtn = "border border-[rgba(239,68,68,0.35)] text-(--red) bg-[rgba(239,68,68,0.06)] hover:bg-[rgba(239,68,68,0.14)]";
  const neutralBtn = "border border-(--border) text-(--text-muted) bg-transparent hover:border-(--border-bright) hover:text-(--text)";

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 relative z-1">
      <div className="w-full max-w-150">
        <div className="text-[11px] font-mono tracking-[0.25em] text-(--text-muted) uppercase mb-6 flex items-center gap-3 before:content-[''] before:inline-block before:w-6 before:h-0.5 before:bg-(--gold) before:shrink-0">
          Omega Strikers
        </div>
        <h2 className="text-[clamp(28px,5vw,48px)] font-extrabold leading-tight tracking-tight mb-2 text-(--text)">
          Room ready
        </h2>
        <p className="font-mono text-xs text-(--text-muted) tracking-[0.08em] mb-8">
          // Room {state.roomId} · Share links below
        </p>

        <div className="bg-(--bg2) border border-(--border) rounded-2xl p-6 mb-4">
          <div className="text-[10px] font-mono tracking-[0.2em] text-(--text-muted) uppercase mb-5">
            Share with teams
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono font-bold tracking-widest text-(--blue)">
              {state.blueName} — Blue side
            </div>
            <div className="bg-(--bg3) border border-(--border) rounded-lg py-2.5 px-3 font-mono text-[11px] text-(--text-dim) break-all leading-relaxed">
              {blueUrl}
            </div>
            <button
              className={`${baseBtn} ${blueBtn} self-start`}
              onClick={() => copy(blueUrl, "blue")}
            >
              {copied === "blue" ? "Copied!" : "Copy blue link"}
            </button>
          </div>

          <div className="h-px bg-(--border) my-5" />

          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono font-bold tracking-widest text-(--red)">
              {state.redName} — Red side
            </div>
            <div className="bg-(--bg3) border border-(--border) rounded-lg py-2.5 px-3 font-mono text-[11px] text-(--text-dim) break-all leading-relaxed">
              {redUrl}
            </div>
            <button
              className={`${baseBtn} ${redBtn} self-start`}
              onClick={() => copy(redUrl, "red")}
            >
              {copied === "red" ? "Copied!" : "Copy red link"}
            </button>
          </div>
        </div>

        <div className="bg-(--bg2) border border-(--border) rounded-2xl p-6 mb-4">
          <div className="text-[10px] font-mono tracking-[0.2em] text-(--text-muted) uppercase mb-5">
            You are the organiser — enter as:
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <button
              className={`${baseBtn} ${blueBtn} flex-1 min-w-30`}
              onClick={() => onEnter("blue")}
            >
              Enter as {state.blueName}
            </button>
            <button
              className={`${baseBtn} ${redBtn} flex-1 min-w-30`}
              onClick={() => onEnter("red")}
            >
              Enter as {state.redName}
            </button>
            <button
              className={`${baseBtn} ${neutralBtn} flex-1 min-w-30`}
              onClick={() => onEnter("spectator")}
            >
              Spectate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
