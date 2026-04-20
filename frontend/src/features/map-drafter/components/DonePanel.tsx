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
  const { state, handleSetStrikerRoom } = useMapDraftContext();
  const blueName = state?.blueName ?? "";
  const redName = state?.redName ?? "";
  const strikerLobbies = state?.strikerLobbies ?? null;
  const actions = state?.actions ?? [];
  const mapStatuses = state
    ? deriveMapStatuses(state, SEQUENCE_MAP[state.bestOf])
    : {};

  const [bannedAwakenings, setBannedAwakenings] = useState<Awakening[]>(() => {
    const existingLobby = strikerLobbies
      ? Object.values(strikerLobbies)[0]
      : null;
    if (existingLobby) return existingLobby.bannedAwakenings as Awakening[];
    try {
      const stored = localStorage.getItem("bannedAwakenings");
      if (stored) return JSON.parse(stored) as Awakening[];
    } catch {
      // ignore
    }
    return DEFAULT_BANNED_AWAKENINGS;
  });
  const [creating, setCreating] = useState<Record<string, boolean>>({});
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const locked = !!(strikerLobbies && Object.keys(strikerLobbies).length > 0);
  const displayedBans = locked
    ? ((Object.values(strikerLobbies!)[0].bannedAwakenings ??
        []) as Awakening[])
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

  async function handlePickFirstPick(map: string, fp: string) {
    if (creating[map]) return;
    setCreating((prev) => ({ ...prev, [map]: true }));
    setCreateErrors((prev) => ({ ...prev, [map]: "" }));
    try {
      const sp = fp === blueName ? redName : blueName;
      const roomId = await createStrikerRoom({
        blueName: fp,
        redName: sp,
        map,
        bannedStarts: bannedAwakenings,
      });
      await handleSetStrikerRoom(map, roomId, fp, bannedAwakenings);
    } catch (e) {
      setCreateErrors((prev) => ({
        ...prev,
        [map]: e instanceof Error ? e.message : "Failed to create room",
      }));
    } finally {
      setCreating((prev) => ({ ...prev, [map]: false }));
    }
  }

  function renderButton(map: string) {
    const openBtnClass =
      "flex justify-center items-center w-full h-8 bg-tools-gold text-black rounded-xl font-head font-bold transition-opacity duration-300 text-sm";

    const lobby = strikerLobbies?.[map];
    const roomId = lobby?.roomId;
    const fp = lobby?.firstPick;

    if (roomId && fp) {
      return (
        <a
          href={`/striker-draft/lobby?room=${roomId}`}
          target="_blank"
          rel="noreferrer"
          className={openBtnClass}
        >
          Open Lobby ({fp} First Pick)
        </a>
      );
    }

    const isCreating = !!creating[map];

    if (isCreating) {
      return (
        <button
          type="button"
          disabled
          className={`${openBtnClass} opacity-50 cursor-default!`}
        >
          Creating Lobby…
        </button>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={!!strikerLobbies?.[map]}
            onClick={() => handlePickFirstPick(map, blueName)}
            className={classNames(
              "flex-1 text-xs font-mono font-semibold tracking-wide h-8 px-2 rounded-lg border transition-colors duration-150 truncate",
              strikerLobbies?.[map]
                ? "border-white/10 text-white/25 bg-white/5 cursor-default!"
                : "border-tools-blue/40 text-tools-blue bg-tools-blue-dim hover:bg-tools-blue/15",
            )}
          >
            {blueName} First Pick
          </button>
          <button
            type="button"
            disabled={!!strikerLobbies?.[map]}
            onClick={() => handlePickFirstPick(map, redName)}
            className={classNames(
              "flex-1 text-xs font-mono font-semibold tracking-wide h-8 px-2 rounded-lg border transition-colors duration-150 truncate",
              strikerLobbies?.[map]
                ? "border-white/10 text-white/25 bg-white/5 cursor-default!"
                : "border-tools-red/40 text-tools-red bg-tools-red-dim hover:bg-tools-red/15",
            )}
          >
            {redName} First Pick
          </button>
        </div>
        {createErrors[map] && (
          <div className="text-xs font-mono text-tools-red text-center">
            {createErrors[map]}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* Awakening ban picker */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between h-6">
          <div className="text-sm font-mono tracking-widest uppercase text-white/60">
            Starting Awakenings —{" "}
            {locked ? "Awakenings Chosen" : "Click to Toggle"}
          </div>
          {locked ? (
            <span className="text-xs font-mono tracking-widest uppercase text-white/30">
              Locked
            </span>
          ) : bannedAwakenings.length !== DEFAULT_BANNED_AWAKENINGS.length ||
            !DEFAULT_BANNED_AWAKENINGS.every((a) =>
              bannedAwakenings.includes(a),
            ) ? (
            <button
              type="button"
              onClick={() => {
                setBannedAwakenings(DEFAULT_BANNED_AWAKENINGS);
                localStorage.setItem(
                  "bannedAwakenings",
                  JSON.stringify(DEFAULT_BANNED_AWAKENINGS),
                );
              }}
              className="text-sm text-tools-red border border-tools-red px-2 py-1 rounded-md hover:bg-white/10 transition-colors duration-150"
            >
              Reset
            </button>
          ) : null}
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
                    "opacity-30 grayscale border-white": isBanned,
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

      {/* Map cards */}
      <div className="flex flex-row flex-wrap justify-center gap-3">
        {picks.map((pick) => {
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
              {renderButton(pick.map)}
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
            {renderButton(decider.map)}
          </div>
        )}
      </div>
    </div>
  );
}
