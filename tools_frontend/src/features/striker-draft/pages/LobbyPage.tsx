import { CURRENT_AWAKENING_POOL, type Team as Side, Team } from "@os-tools/shared";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import LoadingScreen from "../../common/components/LoadingScreen";
import LobbyLink from "../../common/components/LobbyLink";
import LobbyReplayLink from "../../common/components/LobbyReplayLink";
import { BackButton, HomeButton } from "../../common/components/NavButtons";
import { AWAKENING_ICONS } from "../../common/constants/constants";
import { useStrikerDraftContext } from "../context/StrikerDraftContext";

export default function LobbyPage() {
  const { lobbyState, state, loading, handleSidePick } = useStrikerDraftContext();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const room = state?.roomId === lobbyState?.roomId ? state : (lobbyState ?? state);

  useEffect(() => {
    if (!loading && !room) {
      navigate("/striker-draft", { replace: true });
    }
  }, [loading, room, navigate]);

  if (loading || !room) {
    return <LoadingScreen message="Connecting to draft..." />;
  }

  const { roomId, blueName, redName, bannedStarts, map, awakenings, awakeningMode, done } = room;
  const isRandom = awakeningMode === "random";

  function buildUrl(side: Side): string {
    const url = new URL(window.location.origin + "/striker-draft/draft");
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

  const baseBtn = "px-2.5 py-2.5 rounded-lg font-head text-sm font-bold transition-all duration-150";

  return (
    <div className="min-h-screen py-6 flex justify-center items-center">
      <div className="grid grid-cols-3 gap-5 p-5">
        {isRandom && bannedStarts && bannedStarts.length > 0 && (
          <div className="self-start flex flex-col gap-4 bg-tools-carbon border border-white/7 rounded-2xl p-6 justify-center items-center">
            <div className="text-sm font-mono tracking-widest uppercase w-full">Starting Awakenings — Banned</div>
            <div className="grid grid-cols-6 gap-1">
              {CURRENT_AWAKENING_POOL.map((a) => {
                const icon = AWAKENING_ICONS[a];
                const isBanned = bannedStarts.includes(a);
                return (
                  <div
                    key={a}
                    className={classNames(
                      "flex flex-col bg-tools-graphite items-center gap-1 p-2 rounded-lg border border-white/7",
                      { "opacity-30 grayscale": isBanned },
                    )}
                  >
                    <img src={icon} alt={a} className="w-12 h-12 object-contain shrink-0" />
                    <span className="text-xs text-center leading-tight line-clamp-2">{a}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="w-full max-w-160 flex flex-col justify-center gap-3 col-start-2">
          <div className="flex gap-3">
            <BackButton />
            <HomeButton />
          </div>
          <h2 className="text-6xl font-extrabold leading-tight tracking-tight">
            Room <span className="text-tools-gold">Ready</span>
          </h2>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <p className="font-mono text-xs tracking-wider uppercase">
                // Room {roomId} · Striker Draft · Share links below
              </p>
              <p className="font-mono text-xs tracking-wider uppercase text-white/50">
                // {map} · {isRandom ? "Random Awakenings" : `${awakenings.join(" / ")}`}
              </p>
            </div>
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
            <LobbyReplayLink url={replayUrl} available={replayAvailable} completed={room.done} />
          </div>
        </div>
      </div>
    </div>
  );
}
