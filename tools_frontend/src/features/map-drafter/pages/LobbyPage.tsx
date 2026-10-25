import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Side } from "@/features/common/types";
import { Team } from "@/features/common/constants/constants";
import { useMapDraftContext } from "@/features/map-drafter/context/MapDraftContext";
import {
  BackButton,
  HomeButton,
} from "@/features/common/components/NavButtons";
import LoadingScreen from "@/features/common/components/LoadingScreen";
import LobbyLink from "@/features/common/components/LobbyLink";
import LobbyReplayLink from "@/features/common/components/LobbyReplayLink";
import { SEQUENCE_LABELS } from "@/features/map-drafter/constants";

export default function LobbyPage() {
  const { lobbyState, state, loading, handleSidePick } = useMapDraftContext();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const room =
    state?.roomId === lobbyState?.roomId ? state : (lobbyState ?? state);

  useEffect(() => {
    if (!loading && !room) navigate("/map-draft", { replace: true });
  }, [loading, room, navigate]);

  if (loading || !room)
    return <LoadingScreen message="Connecting to draft..." />;

  const { roomId, bestOf, blueName, redName, done } = room;

  function buildUrl(side: Side): string {
    const url = new URL(window.location.origin + "/map-draft/draft");
    url.searchParams.set("room", roomId);
    url.searchParams.set("side", side);
    return url.toString();
  }

  async function copyAll() {
    const text = `${blueName} - ${blueUrl}\n${redName} - ${redUrl}\nSPECTATOR - ${spectatorUrl}\nREPLAY${!done ? " (unavailable until draft complete)" : ""} - ${replayUrl}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const blueUrl = buildUrl(Team.Blue);
  const redUrl = buildUrl(Team.Red);
  const spectatorUrl = buildUrl(Team.Spectator);
  const replayLink = new URL(spectatorUrl);
  replayLink.searchParams.delete("side");
  replayLink.searchParams.set("replay", "1");
  const replayUrl = replayLink.toString();
  const replayAvailable = Boolean(room.done && room.replayEvents?.length);

  const baseBtn =
    "px-2.5 py-2.5 rounded-lg font-head text-sm font-bold transition-all duration-150";

  return (
    <div className="min-h-screen py-6 flex items-center justify-center">
      <div className="flex flex-col gap-3 w-full max-w-160">
        <div className="flex gap-3">
          <BackButton />
          <HomeButton />
        </div>
        <h2 className="text-6xl font-extrabold leading-tight tracking-tight">
          Room <span className="text-tools-gold">Ready</span>
        </h2>

        <div className="flex items-center justify-between">
          <p className="font-mono text-xs tracking-wider uppercase">
            // Room {roomId} · Map Draft · {SEQUENCE_LABELS[bestOf]} · Share
            links below
          </p>
          <button
            className={`${baseBtn} border border-tools-gold/40 text-tools-gold bg-tools-gold/6 hover:bg-tools-gold/14`}
            onClick={copyAll}
          >
            {copied ? "Copied!" : "Copy all links"}
          </button>
        </div>

        <div className="flex flex-col gap-3 bg-tools-carbon border border-white/7 rounded-2xl p-6">
          <LobbyLink
            title={`${blueName} — Blue side`}
            url={blueUrl}
            copyLabel="Copy blue link"
            actionLabel="Enter as blue team"
            tone="blue"
            onEnter={() => handleSidePick(Team.Blue)}
          />

          <div className="h-px bg-tools-gold my-3" />

          <LobbyLink
            title={`${redName} — Red side`}
            url={redUrl}
            copyLabel="Copy red link"
            actionLabel="Enter as red team"
            tone="red"
            onEnter={() => handleSidePick(Team.Red)}
          />

          <div className="h-px bg-tools-gold my-3" />

          <LobbyLink
            title={"Spectator"}
            url={spectatorUrl}
            copyLabel="Copy spectator link"
            actionLabel="Enter as spectator"
            tone="neutral"
            onEnter={() => handleSidePick(Team.Spectator)}
          />
          <LobbyReplayLink
            url={replayUrl}
            available={replayAvailable}
            completed={room.done}
          />
        </div>
      </div>
    </div>
  );
}
