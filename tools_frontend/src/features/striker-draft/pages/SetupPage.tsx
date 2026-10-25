import { Awakening, AWAKENING_CONFLICTS, AwakeningMode, CURRENT_AWAKENING_POOL, GameMap } from "@os-tools/shared";
import classNames from "classnames";
import { useEffect, useState } from "react";

import { HomeButton } from "../../common/components/NavButtons";
import Spinner from "../../common/components/Spinner";
import { useToast } from "../../common/components/Toast";
import { AWAKENING_ICONS, DEFAULT_BANNED_AWAKENINGS } from "../../common/constants/constants";
import AwakeningPicker from "../components/AwakeningPicker";
import { useStrikerDraftContext } from "../context/StrikerDraftContext";

const ALL_AWAKENING_NAMES = new Set<string>(Object.values(Awakening));

function getInitialParams() {
  return new URLSearchParams(window.location.search);
}

export default function SetupPage() {
  const { toast } = useToast();
  const { handleLaunch } = useStrikerDraftContext();
  const [blueName, setBlueName] = useState(() => {
    return getInitialParams().get("blue") ?? "";
  });
  const [redName, setRedName] = useState(() => {
    return getInitialParams().get("red") ?? "";
  });
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState<GameMap | "">(() => {
    const urlMap = getInitialParams().get("map") ?? "";

    return Object.values(GameMap).find((name) => name === urlMap) ?? "";
  });
  const [awakening, setAwakening] = useState(() => {
    const urlMode = getInitialParams().get("awakeningMode");

    return urlMode === AwakeningMode.Custom ? AwakeningMode.Custom : AwakeningMode.Random;
  });
  const [customAwakenings, setCustomAwakenings] = useState<{ first: Awakening | ""; second: Awakening | "" }>(() => {
    const params = getInitialParams();
    const first = params.get("awk1") ?? "";
    const second = params.get("awk2") ?? "";

    return {
      first: Object.values(Awakening).find((name) => name === first) ?? "",
      second: Object.values(Awakening).find((name) => name === second) ?? "",
    };
  });
  const [bannedAwakenings, setBannedAwakenings] = useState<Awakening[]>(() => {
    try {
      const params = getInitialParams();
      const urlBanned = params.get("banned");
      if (urlBanned) {
        const parsed = JSON.parse(urlBanned) as Awakening[];
        if (Array.isArray(parsed) && parsed.every((a) => ALL_AWAKENING_NAMES.has(a))) {
          localStorage.setItem("bannedAwakenings", JSON.stringify(parsed));

          return parsed;
        }
      }
    } catch {
      // ignore parse errors
    }
    try {
      const stored = localStorage.getItem("bannedAwakenings");
      if (stored) {
        return JSON.parse(stored) as Awakening[];
      }
    } catch {
      // ignore parse errors, fall back to default
    }

    return DEFAULT_BANNED_AWAKENINGS;
  });

  useEffect(() => {
    const params = getInitialParams();
    if (
      params.has("blue") ||
      params.has("red") ||
      params.has("map") ||
      params.has("awakeningMode") ||
      params.has("awk1") ||
      params.has("awk2") ||
      params.has("banned")
    ) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  function handleCopyConfigLink() {
    const paramObj: Record<string, string> = {};
    if (blueName.trim()) {
      paramObj.blue = blueName.trim();
    }
    if (redName.trim()) {
      paramObj.red = redName.trim();
    }
    if (map) {
      paramObj.map = map;
    }
    paramObj.awakeningMode = awakening;
    if (awakening === AwakeningMode.Custom) {
      if (customAwakenings.first) {
        paramObj.awk1 = customAwakenings.first;
      }
      if (customAwakenings.second) {
        paramObj.awk2 = customAwakenings.second;
      }
    } else {
      paramObj.banned = JSON.stringify(bannedAwakenings);
    }
    const params = new URLSearchParams(paramObj);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast({
      message: "Config link copied!",
      variant: "success",
      position: "top-center",
    });
  }

  const handleAwakeningChange = (key: "first" | "second", value: Awakening) => {
    setCustomAwakenings((prev) => ({ ...prev, [key]: value }));
  };

  const handleBannedAwakeningToggle = (a: Awakening) => {
    setBannedAwakenings((prev) => {
      const next = prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a];
      localStorage.setItem("bannedAwakenings", JSON.stringify(next));

      return next;
    });
  };

  const resetBannedAwakenings = () => {
    setBannedAwakenings(() => {
      localStorage.setItem("bannedAwakenings", JSON.stringify(DEFAULT_BANNED_AWAKENINGS));

      return DEFAULT_BANNED_AWAKENINGS;
    });
  };

  async function handleSubmit() {
    if (!map || (awakening === AwakeningMode.Custom && (!customAwakenings.first || !customAwakenings.second))) {
      return;
    }

    setLoading(true);
    try {
      await handleLaunch({
        blueName,
        redName,
        map,
        awakeningMode: awakening,
        customAwakenings:
          awakening === AwakeningMode.Custom
            ? [customAwakenings.first, customAwakenings.second].filter((value): value is Awakening => value !== "")
            : [],
        bannedStarts: awakening === AwakeningMode.Random ? bannedAwakenings : [],
      });
    } catch (e) {
      toast({
        message: e instanceof Error ? e.message : "An unexpected error occurred",
        variant: "error",
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  }

  const isDisabled =
    loading || !map || (awakening === AwakeningMode.Custom && (!customAwakenings.first || !customAwakenings.second));

  return (
    <div className="h-screen flex justify-center items-center">
      <div className="grid grid-cols-3 gap-5 p-5">
        {/* Banned awakenings area */}
        {awakening === AwakeningMode.Random && (
          <div className="w-full max-w-160 flex flex-col gap-4 bg-tools-carbon border border-white/7 rounded-2xl p-6 justify-center items-center">
            <div className="flex justify-between items-center w-full h-6">
              <div className="text-sm font-mono tracking-widest uppercase">Starting Awakenings - Click to Toggle</div>
              {(bannedAwakenings.length !== DEFAULT_BANNED_AWAKENINGS.length ||
                !DEFAULT_BANNED_AWAKENINGS.every((a) => bannedAwakenings.includes(a))) && (
                <button
                  onClick={resetBannedAwakenings}
                  type="button"
                  className="text-sm text-tools-red border border-tools-red px-2 py-1 rounded-md hover:bg-white/10 transition-colors duration-150"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="grid grid-cols-6 gap-1">
              {CURRENT_AWAKENING_POOL.map((a) => {
                const icon = AWAKENING_ICONS[a];
                const isBanned = bannedAwakenings.includes(a);

                return (
                  <button
                    key={a}
                    type="button"
                    className={classNames(
                      "flex flex-col bg-tools-graphite items-center gap-1 p-2 rounded-lg transition-all duration-150 border ",
                      {
                        "hover:bg-white/10 border-white/7": !isBanned,
                        "opacity-30 grayscale border-white": isBanned,
                      },
                    )}
                    onClick={() => handleBannedAwakeningToggle(a)}
                  >
                    <img src={icon} alt={a} className="w-12 h-12 object-contain shrink-0" />
                    <span className="text-xs text-center leading-tight line-clamp-2">{a}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Center area */}
        <div className="w-full max-w-160 flex flex-col justify-center gap-3 col-start-2">
          <div className="flex items-center justify-between">
            <HomeButton />
            <button
              type="button"
              onClick={handleCopyConfigLink}
              className="text-sm font-mono text-white border border-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors duration-150"
            >
              Copy Config Link
            </button>
          </div>
          <h1 className="text-6xl font-extrabold leading-none tracking-tight">
            Striker <span className="text-tools-gold">Draft</span>
          </h1>

          <div className="flex flex-col gap-4 bg-tools-carbon border border-white/7 rounded-2xl p-6">
            <div className="text-sm font-mono tracking-widest uppercase">Teams</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold tracking-widest py-0.5 px-1.75 rounded pointer-events-none bg-tools-blue-dim text-tools-blue">
                  Blue
                </span>
                <input
                  className="w-full bg-tools-graphite border border-white/7 rounded-lg py-2.5 pr-3 pl-16 font-head font-semibold outline-none transition-colors duration-200 focus:border-white/15"
                  type="text"
                  placeholder="Team A"
                  maxLength={24}
                  value={blueName}
                  onChange={(e) => setBlueName(e.target.value)}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold tracking-widest py-0.5 px-1.75 rounded pointer-events-none bg-tools-red-dim text-tools-red">
                  Red
                </span>
                <input
                  className="w-full bg-tools-graphite border border-white/7 rounded-lg py-2.5 pr-3 pl-16 font-head font-semibold outline-none transition-colors duration-200 focus:border-white/15"
                  type="text"
                  placeholder="Team B"
                  maxLength={24}
                  value={redName}
                  onChange={(e) => setRedName(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 bg-tools-carbon border border-white/7 rounded-2xl p-6">
            <div className="flex flex-col gap-4">
              <div className="text-sm font-mono tracking-widest uppercase">Map</div>
              <select
                value={map}
                onChange={(e) => setMap(e.target.value as GameMap | "")}
                className="border border-white/7 bg-tools-graphite p-3 font-bold rounded-lg cursor-pointer transition-colors duration-200 focus:border-white/15"
              >
                <option value="">Select a map</option>
                {Object.values(GameMap)
                  .sort((a, b) => {
                    return a.localeCompare(b);
                  })
                  .map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-4">
              <div className="text-sm font-mono tracking-widest uppercase">Awakenings</div>
              <div className="flex flex-row gap-3 w-full">
                <button
                  className={`w-full border rounded-lg p-2 font-mono font-semibold transition-colors duration-200 uppercase ${
                    awakening === AwakeningMode.Random
                      ? "border-tools-gold/40 bg-tools-gold/6"
                      : "bg-tools-graphite border-white/7"
                  }`}
                  onClick={() => setAwakening(AwakeningMode.Random)}
                >
                  Random
                </button>
                <button
                  className={`w-full border rounded-lg p-2 font-mono font-semibold transition-colors duration-200 uppercase ${
                    awakening === AwakeningMode.Custom
                      ? "border-tools-gold/40 bg-tools-gold/6"
                      : "bg-tools-graphite border-white/7"
                  }`}
                  onClick={() => setAwakening(AwakeningMode.Custom)}
                >
                  Custom
                </button>
              </div>
              {awakening === AwakeningMode.Custom && (
                <div className="flex gap-3">
                  <AwakeningPicker
                    value={customAwakenings.first}
                    onChange={(v) => handleAwakeningChange("first", v)}
                    exclude={
                      customAwakenings.second
                        ? [customAwakenings.second, ...(AWAKENING_CONFLICTS[customAwakenings.second] ?? [])]
                        : []
                    }
                  />
                  <AwakeningPicker
                    value={customAwakenings.second}
                    onChange={(v) => handleAwakeningChange("second", v)}
                    exclude={
                      customAwakenings.first
                        ? [customAwakenings.first, ...(AWAKENING_CONFLICTS[customAwakenings.first] ?? [])]
                        : []
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <button
            className="flex justify-center items-center w-full h-14 bg-tools-gold text-black rounded-2xl font-head text-xl font-bold disabled:cursor-default! disabled:opacity-50 transition-opacity duration-300"
            disabled={isDisabled}
            onClick={handleSubmit}
          >
            {loading ? <Spinner size="lg" primary="white" secondary="black" /> : "Create Striker Draft Room →"}
          </button>
        </div>
      </div>
    </div>
  );
}
