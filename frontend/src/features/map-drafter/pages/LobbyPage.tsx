import { useState } from "react";
import type { Side } from "@map-drafter/types";
import { useDraftContext } from "@/features/map-drafter/context/DraftContext";

function buildUrl(roomId: string, side: Side): string {
  const url = new URL(window.location.origin + "/map-draft");
  url.searchParams.set("room", roomId);
  url.searchParams.set("side", side);
  return url.toString();
}

export default function LobbyPage() {
  const { lobbyState, handleSidePick } = useDraftContext();
  const [copied, setCopied] = useState<Side | null>(null);

  if (!lobbyState) return null;

  const blueUrl = buildUrl(lobbyState.roomId, "blue");
  const redUrl = buildUrl(lobbyState.roomId, "red");

  async function copy(url: string, side: Side) {
    await navigator.clipboard.writeText(url);
    setCopied(side);
    setTimeout(() => setCopied(null), 2000);
  }

  const baseBtn =
    "px-2.5 py-2.5 rounded-lg font-head text-[13px] font-bold transition-all duration-150";
  const blueBtn =
    "border border-tools-blue/35 text-tools-blue bg-tools-blue/6 hover:bg-tools-blue/14";
  const redBtn =
    "border border-tools-red/35 text-tools-red bg-tools-red/6 hover:bg-tools-red/14";
  const neutralBtn =
    "border border-tools-border text-tools-text-muted bg-transparent hover:border-tools-border-bright hover:text-tools-text";

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 relative z-1">
      <div className="w-full max-w-150">
        <div className="text-[11px] font-mono tracking-[0.25em] text-tools-text-muted uppercase mb-6 flex items-center gap-3 before:content-[''] before:inline-block before:w-6 before:h-0.5 before:bg-tools-gold before:shrink-0">
          Omega Strikers
        </div>
        <h2 className="text-[clamp(28px,5vw,48px)] font-extrabold leading-tight tracking-tight mb-2 text-tools-text">
          Room ready
        </h2>
        <p className="font-mono text-xs text-tools-text-muted tracking-[0.08em] mb-8">
          // Room {lobbyState.roomId} · Share links below
        </p>

        <div className="bg-tools-bg2 border border-tools-border rounded-2xl p-6 mb-4">
          <div className="text-[10px] font-mono tracking-[0.2em] text-tools-text-muted uppercase mb-5">
            Share with teams
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono font-bold tracking-widest text-tools-blue">
              {lobbyState.blueName} — Blue side
            </div>
            <div className="bg-tools-bg3 border border-tools-border rounded-lg py-2.5 px-3 font-mono text-[11px] text-tools-text-dim break-all leading-relaxed">
              {blueUrl}
            </div>
            <button
              className={`${baseBtn} ${blueBtn} self-start`}
              onClick={() => copy(blueUrl, "blue")}
            >
              {copied === "blue" ? "Copied!" : "Copy blue link"}
            </button>
          </div>

          <div className="h-px bg-tools-border my-5" />

          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono font-bold tracking-widest text-tools-red">
              {lobbyState.redName} — Red side
            </div>
            <div className="bg-tools-bg3 border border-tools-border rounded-lg py-2.5 px-3 font-mono text-[11px] text-tools-text-dim break-all leading-relaxed">
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

        <div className="bg-tools-bg2 border border-tools-border rounded-2xl p-6 mb-4">
          <div className="text-[10px] font-mono tracking-[0.2em] text-tools-text-muted uppercase mb-5">
            You are the organiser — enter as:
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <button
              className={`${baseBtn} ${blueBtn} flex-1 min-w-30`}
              onClick={() => handleSidePick("blue")}
            >
              Enter as {lobbyState.blueName}
            </button>
            <button
              className={`${baseBtn} ${redBtn} flex-1 min-w-30`}
              onClick={() => handleSidePick("red")}
            >
              Enter as {lobbyState.redName}
            </button>
            <button
              className={`${baseBtn} ${neutralBtn} flex-1 min-w-30`}
              onClick={() => handleSidePick("spectator")}
            >
              Spectate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
