import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Side } from "@/features/common/types";
import { Team } from "@/features/common/constants";
import { useStrikerDraftContext } from "@/features/striker-draft/context/StrikerDraftContext";

export default function LobbyPage() {
  const { lobbyState, state, handleSidePick } = useStrikerDraftContext();
  const [copied, setCopied] = useState<Side | null>(null);
  const navigate = useNavigate();

  const room = lobbyState ?? state;

  useEffect(() => {
    if (!room) navigate("/striker-draft", { replace: true });
  }, [room, navigate]);

  if (!room) return null;

  const { roomId, blueName, redName } = room;

  function buildUrl(side: Side): string {
    const url = new URL(window.location.origin + "/striker-draft/draft");
    url.searchParams.set("room", roomId);
    url.searchParams.set("side", side);
    return url.toString();
  }

  async function copy(url: string, side: Side) {
    await navigator.clipboard.writeText(url);
    setCopied(side);
    setTimeout(() => setCopied(null), 2000);
  }

  const blueUrl = buildUrl(Team.Blue);
  const redUrl = buildUrl(Team.Red);
  const spectatorUrl = buildUrl(Team.Spectator);

  const baseBtn =
    "px-2.5 py-2.5 rounded-lg font-head text-sm font-bold transition-all duration-150";
  const blueBtn =
    "border border-tools-blue/35 text-tools-blue bg-tools-blue/6 hover:bg-tools-blue/14";
  const redBtn =
    "border border-tools-red/35 text-tools-red bg-tools-red/6 hover:bg-tools-red/14";
  const neutralBtn =
    "border border-white/7 bg-transparent hover:border-white/15 hover:bg-white/5";

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col gap-3 w-full max-w-160">
        <h2 className="text-6xl font-extrabold leading-tight tracking-tight">
          Room <span className="text-tools-gold">Ready</span>
        </h2>

        <p className="font-mono text-xs tracking-wider uppercase">
          // Room {roomId} · Striker Draft · Share links below
        </p>

        <div className="flex flex-col gap-3 bg-tools-carbon border border-white/7 rounded-2xl p-6">
          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono font-bold tracking-widest text-tools-blue">
              {blueName} — Blue side
            </div>
            <div className="bg-tools-graphite border border-white/7 rounded-lg py-2.5 px-3 font-mono text-xs break-all leading-relaxed">
              {blueUrl}
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <button
                className={`${baseBtn} ${blueBtn}`}
                onClick={() => copy(blueUrl, Team.Blue)}
              >
                {copied === Team.Blue ? "Copied!" : "Copy blue link"}
              </button>
              <button
                className={`${baseBtn} ${blueBtn}`}
                onClick={() => handleSidePick(Team.Blue)}
              >
                Enter as {blueName}
              </button>
            </div>
          </div>

          <div className="h-px bg-tools-gold my-3" />

          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono font-bold tracking-widest text-tools-red">
              {redName} — Red side
            </div>
            <div className="bg-tools-graphite border border-white/7 rounded-lg py-2.5 px-3 font-mono text-xs break-all leading-relaxed">
              {redUrl}
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <button
                className={`${baseBtn} ${redBtn}`}
                onClick={() => copy(redUrl, Team.Red)}
              >
                {copied === Team.Red ? "Copied!" : "Copy red link"}
              </button>
              <button
                className={`${baseBtn} ${redBtn}`}
                onClick={() => handleSidePick(Team.Red)}
              >
                Enter as {redName}
              </button>
            </div>
          </div>

          <div className="h-px bg-tools-gold my-3" />

          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono font-bold tracking-widest">
              Spectator
            </div>
            <div className="bg-tools-graphite border border-white/7 rounded-lg py-2.5 px-3 font-mono text-xs break-all leading-relaxed">
              {spectatorUrl}
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <button
                className={`${baseBtn} ${neutralBtn}`}
                onClick={() => copy(spectatorUrl, Team.Spectator)}
              >
                {copied === Team.Spectator ? "Copied!" : "Copy spectator link"}
              </button>
              <div className="flex gap-2.5 flex-wrap">
                <button
                  className={`${baseBtn} ${neutralBtn}`}
                  onClick={() => handleSidePick(Team.Spectator)}
                >
                  Enter as Spectator
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
