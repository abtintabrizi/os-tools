import { useState } from "react";
import classNames from "classnames";
import {
  ALL_MAPS,
  ALL_AWAKENINGS,
  CURRENT_AWAKENING_POOL,
  DEFAULT_BANNED_AWAKENINGS,
  Awakening,
} from "@/features/common/constants/constants";
import { useMapDraftContext } from "@/features/map-drafter/context/MapDraftContext";
import { deriveMapStatuses } from "@/features/map-drafter/utils";
import { SEQUENCE_MAP } from "@map-drafter/constants.ts";
import { API_BASE } from "@/features/common/hooks/useRoomApi";

async function createStrikerRoom(config: {
  blueName: string;
  redName: string;
  map: string;
  bannedStarts: string[];
}): Promise<string> {
  const resp = await fetch(`${API_BASE}/striker-draft/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...config, awakeningMode: "random" }),
  });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.detail ?? "Failed to create striker draft room");
  }
  const data = await resp.json();
  return data.roomId as string;
}

export default function DonePanel() {
  const { state, handleGame1FirstPick, handleSetStrikerRooms } =
    useMapDraftContext();
  const blueName = state?.blueName ?? "";
  const redName = state?.redName ?? "";
  const game1FirstPick = state?.game1FirstPick ?? null;
  const strikerRooms = state?.strikerRooms ?? null;
  const actions = state?.actions ?? [];
  const mapStatuses = state
    ? deriveMapStatuses(state, SEQUENCE_MAP[state.bestOf])
    : {};

  const [bannedAwakenings, setBannedAwakenings] = useState<Awakening[]>(() => {
    if (state?.strikerBannedAwakenings)
      return state.strikerBannedAwakenings as Awakening[];
    try {
      const stored = localStorage.getItem("bannedAwakenings");
      if (stored) return JSON.parse(stored) as Awakening[];
    } catch {
      // ignore
    }
    return DEFAULT_BANNED_AWAKENINGS;
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const locked = strikerRooms !== null;
  const displayedBans = locked
    ? ((state?.strikerBannedAwakenings ?? []) as Awakening[])
    : bannedAwakenings;

  const picks = actions
    .filter((a) => a.action === "pick" && a.team !== null)
    .map((a) => {
      const status = mapStatuses[a.map];
      const gameNum = status?.startsWith("picked-g")
        ? parseInt(status.replace("picked-g", ""), 10)
        : 0;
      return { ...a, gameNum };
    })
    .sort((a, b) => a.gameNum - b.gameNum);

  const decider = actions.find((a) => a.action === "pick" && a.team === null);
  const deciderImage = decider
    ? ALL_MAPS.find((m) => m.name === decider.map)?.image
    : null;

  const totalGames = picks.length + (decider ? 1 : 0);

  function firstPickForGame(gameIndex: number): string | null {
    if (!game1FirstPick) return null;
    const other = game1FirstPick === blueName ? redName : blueName;
    return gameIndex % 2 === 0 ? game1FirstPick : other;
  }

  function toggleBan(a: Awakening) {
    if (locked) return;
    setBannedAwakenings((prev) => {
      const next = prev.includes(a)
        ? prev.filter((x) => x !== a)
        : [...prev, a];
      localStorage.setItem("bannedAwakenings", JSON.stringify(next));
      return next;
    });
  }

  async function handleCreateRooms(clickedMap: string) {
    if (!game1FirstPick || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const allGames: { map: string; gameIndex: number }[] = [
        ...picks.map((p, i) => ({ map: p.map, gameIndex: i })),
        ...(decider ? [{ map: decider.map, gameIndex: totalGames - 1 }] : []),
      ];

      const rooms: Record<string, string> = {};
      await Promise.all(
        allGames.map(async ({ map, gameIndex }) => {
          const firstPick = firstPickForGame(gameIndex)!;
          const secondPick = firstPick === blueName ? redName : blueName;
          const roomId = await createStrikerRoom({
            blueName: firstPick,
            redName: secondPick,
            map,
            bannedStarts: bannedAwakenings,
          });
          rooms[map] = roomId;
        }),
      );

      await handleSetStrikerRooms(rooms, bannedAwakenings);
      window.open(
        `/striker-draft/lobby?room=${rooms[clickedMap]}`,
        "_blank",
        "noreferrer",
      );
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create rooms");
    } finally {
      setCreating(false);
    }
  }

  function renderButton(map: string, gameIndex: number) {
    const firstPick = firstPickForGame(gameIndex);
    const btnClass =
      "flex justify-center items-center w-full py-2 bg-tools-gold text-black rounded-xl font-head font-bold disabled:cursor-default! disabled:opacity-50 transition-opacity duration-300 text-sm";

    if (strikerRooms) {
      const roomId = strikerRooms[map];
      return (
        <a
          href={`/striker-draft/lobby?room=${roomId}`}
          target="_blank"
          rel="noreferrer"
          className={btnClass}
        >
          Open Lobby ({firstPick} First Pick)
        </a>
      );
    }

    return (
      <button
        type="button"
        disabled={!firstPick || creating}
        onClick={() => handleCreateRooms(map)}
        className={btnClass}
      >
        {creating
          ? "Creating Lobbies…"
          : firstPick
            ? `Create Lobby (${firstPick} First Pick)`
            : "Choose G1 first pick above"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Awakening ban picker */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-mono tracking-widest uppercase text-white/60">
            Starting Awakenings —{" "}
            {locked ? "Awakenings Chosen" : "Click to Toggle"}
          </div>
          {locked && (
            <span className="text-xs font-mono tracking-widest uppercase text-white/30">
              Locked
            </span>
          )}
        </div>
        <div className="grid grid-cols-10 gap-1">
          {CURRENT_AWAKENING_POOL.map((a) => {
            const icon = ALL_AWAKENINGS.find((b) => b.name === a)?.icon;
            const isBanned = displayedBans.includes(a);
            return (
              <button
                key={a}
                type="button"
                disabled={locked}
                onClick={() => toggleBan(a)}
                className={classNames(
                  "flex flex-col bg-tools-graphite items-center gap-1 p-1.5 rounded-lg transition-all duration-150 border",
                  {
                    "opacity-30 grayscale border-white cursor-default!":
                      isBanned,
                    " border-white/7": !isBanned,
                    "hover:bg-white/10": !isBanned && !locked,
                    "cursor-default!": locked,
                  },
                )}
              >
                <img
                  src={icon}
                  alt={a}
                  className="w-8 h-8 object-contain shrink-0"
                />
              </button>
            );
          })}
        </div>
      </div>

      {createError && (
        <div className="text-xs font-mono text-tools-red text-center">
          {createError}
        </div>
      )}

      {/* G1 first pick selection (only shown before rooms created) */}
      {!strikerRooms && !game1FirstPick && (
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={() => handleGame1FirstPick(blueName)}
            className="text-xs font-mono font-semibold tracking-wide py-1.5 px-3 rounded-lg border border-tools-blue/40 text-tools-blue bg-tools-blue-dim hover:bg-tools-blue/15 transition-colors duration-150"
          >
            {blueName} First Pick in G1
          </button>
          <button
            type="button"
            onClick={() => handleGame1FirstPick(redName)}
            className="text-xs font-mono font-semibold tracking-wide py-1.5 px-3 rounded-lg border border-tools-red/40 text-tools-red bg-tools-red-dim hover:bg-tools-red/15 transition-colors duration-150"
          >
            {redName} First Pick in G1
          </button>
        </div>
      )}

      {/* Map cards */}
      <div className="flex flex-row flex-wrap justify-center gap-3">
        {picks.map((pick, i) => {
          const isBlue = pick.team === blueName;
          const borderClass = isBlue
            ? "border-tools-blue/40"
            : "border-tools-red/40";
          const teamClass = isBlue ? "text-tools-blue" : "text-tools-red";
          const image = ALL_MAPS.find((m) => m.name === pick.map)?.image;

          return (
            <div
              key={pick.map}
              className="flex flex-col gap-2 w-[calc(33.333%-0.5rem)]"
            >
              <div
                className={`relative border-2 ${borderClass} rounded-xl overflow-hidden aspect-video`}
              >
                {image && (
                  <img
                    src={image}
                    alt={pick.map}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="font-mono tracking-widest uppercase text-white/60">
                    Game {pick.gameNum}
                  </div>
                  <div className="font-bold leading-tight">{pick.map}</div>
                  <div className={`font-mono tracking-widest ${teamClass}`}>
                    {pick.team}
                  </div>
                </div>
              </div>
              {renderButton(pick.map, i)}
            </div>
          );
        })}

        {decider && (
          <div className="flex flex-col gap-2 w-[calc(33.333%-0.5rem)]">
            <div className="relative border-2 border-tools-gold/50 rounded-xl overflow-hidden aspect-video">
              {deciderImage && (
                <img
                  src={deciderImage}
                  alt={decider.map}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="font-mono tracking-widest uppercase text-tools-gold/80">
                  Game 3 · Decider
                </div>
                <div className="font-bold leading-tight">{decider.map}</div>
              </div>
            </div>
            {renderButton(decider.map, totalGames - 1)}
          </div>
        )}
      </div>
    </div>
  );
}
