import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Side } from "@map-drafter/types";
import { useDraftContext } from "@/features/map-drafter/context/DraftContext";

function buildUrl(roomId: string, side: Side): string {
  const url = new URL(window.location.origin + "/map-draft/draft");
  url.searchParams.set("room", roomId);
  url.searchParams.set("side", side);
  return url.toString();
}

export default function LobbyPage() {
  const { lobbyState, state, handleSidePick } = useDraftContext();
  const [copied, setCopied] = useState<Side | null>(null);
  const navigate = useNavigate();

  const room = lobbyState ?? state;

  useEffect(() => {
    if (!room) navigate("/map-draft", { replace: true });
  }, [room, navigate]);

  if (!room) return null;

  const blueUrl = buildUrl(room.roomId, "blue");
  const redUrl = buildUrl(room.roomId, "red");

  async function copy(url: string, side: Side) {
    await navigator.clipboard.writeText(url);
    setCopied(side);
    setTimeout(() => setCopied(null), 2000);
  }

  const baseBtn =
    "px-2.5 py-2.5 rounded-lg font-head text-sm font-bold transition-all duration-150";
  const blueBtn =
    "border border-tools-blue/35 text-tools-blue bg-tools-blue/6 hover:bg-tools-blue/14";
  const redBtn =
    "border border-tools-red/35 text-tools-red bg-tools-red/6 hover:bg-tools-red/14";
  const neutralBtn =
    "border border-white/7 bg-transparent hover:border-white/15";

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col gap-3 w-full max-w-160">
        <h2 className="text-6xl font-extrabold leading-tight tracking-tight">
          Room <span className="text-tools-gold">Ready</span>
        </h2>

        <p className="font-mono text-xs tracking-wider uppercase">
          // Room {room.roomId} · {room.bestOf} · Share links below
        </p>

        <div className="flex flex-col gap-3 bg-tools-carbon border border-white/7 rounded-2xl p-6">
          <div className="text-sm font-mono tracking-[0.2em] uppercase">
            Share with teams
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono font-bold tracking-widest text-tools-blue">
              {room.blueName} — Blue side
            </div>
            <div className="bg-tools-graphite border border-white/7 rounded-lg py-2.5 px-3 font-mono text-xs break-all leading-relaxed">
              {blueUrl}
            </div>
            <button
              className={`${baseBtn} ${blueBtn} self-start`}
              onClick={() => copy(blueUrl, "blue")}
            >
              {copied === "blue" ? "Copied!" : "Copy blue link"}
            </button>
          </div>

          <div className="h-px bg-tools-gold my-3" />

          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono font-bold tracking-widest text-tools-red">
              {room.redName} — Red side
            </div>
            <div className="bg-tools-graphite border border-white/7 rounded-lg py-2.5 px-3 font-mono text-xs break-all leading-relaxed">
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

        <div className="flex flex-col gap-4 bg-tools-carbon border border-white/7 rounded-2xl p-6">
          <div className="text-sm font-mono tracking-[0.2em] uppercase">
            You are the organiser — enter as:
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <button
              className={`${baseBtn} ${blueBtn} flex-1 min-w-30`}
              onClick={() => handleSidePick("blue")}
            >
              Enter as {room.blueName}
            </button>
            <button
              className={`${baseBtn} ${redBtn} flex-1 min-w-30`}
              onClick={() => handleSidePick("red")}
            >
              Enter as {room.redName}
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
