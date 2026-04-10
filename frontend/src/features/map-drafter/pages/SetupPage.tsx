import { useEffect, useState } from "react";
import {
  ALL_MAPS,
  CURRENT_MAP_POOL,
} from "@/features/common/constants/constants";
import { useMapDraftContext } from "@/features/map-drafter/context/MapDraftContext";
import { useToast } from "@/features/common/components/Toast";
import Spinner from "@/features/common/components/Spinner";
import { SEQUENCE_MAP, SEQUENCE_LABELS } from "@map-drafter/constants.ts";
import { Sequence, SequenceKey } from "@/features/map-drafter/types";
import { HomeButton } from "@/features/common/components/NavButtons";

export default function SetupPage() {
  const { toast } = useToast();
  const { handleLaunch } = useMapDraftContext();
  const [blueName, setBlueName] = useState("");
  const [redName, setRedName] = useState("");
  const [bestOf, setBestOf] = useState<SequenceKey>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFormat = params.get("format");
    if (urlFormat && urlFormat in SEQUENCE_MAP) {
      localStorage.setItem("mapDraftBestOf", urlFormat);
      return urlFormat as SequenceKey;
    }
    const stored = localStorage.getItem("mapDraftBestOf") as SequenceKey | null;
    return stored && stored in SEQUENCE_MAP ? stored : Sequence.BO3;
  });
  const [enabledMaps, setEnabledMaps] = useState<Set<string>>(() => {
    const allMapNames: Set<string> = new Set(ALL_MAPS.map((m) => m.name));
    try {
      const params = new URLSearchParams(window.location.search);
      const urlPool = params.get("pool");
      if (urlPool) {
        const parsed = JSON.parse(urlPool) as string[];
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every((m) => allMapNames.has(m))
        ) {
          localStorage.setItem("mapDraftEnabledMaps", JSON.stringify(parsed));
          return new Set(parsed);
        }
      }
    } catch {
      // ignore parse errors
    }
    try {
      const stored = localStorage.getItem("mapDraftEnabledMaps");
      if (stored) return new Set(JSON.parse(stored) as string[]);
    } catch {
      // ignore parse errors, fall back to default
    }
    return new Set(CURRENT_MAP_POOL);
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("pool") || params.has("format")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  function toggleMap(map: string) {
    setEnabledMaps((prev) => {
      const next = new Set(prev);
      if (next.has(map)) next.delete(map);
      else next.add(map);
      localStorage.setItem("mapDraftEnabledMaps", JSON.stringify([...next]));
      return next;
    });
  }

  function handleBestOfChange(seq: SequenceKey) {
    setBestOf(seq);
    localStorage.setItem("mapDraftBestOf", seq);
  }

  function resetEnabledMaps() {
    setEnabledMaps(new Set(CURRENT_MAP_POOL));
    localStorage.setItem(
      "mapDraftEnabledMaps",
      JSON.stringify(CURRENT_MAP_POOL),
    );
  }

  function handleCopyConfigLink() {
    const params = new URLSearchParams({
      pool: JSON.stringify([...enabledMaps]),
      format: bestOf,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast({ message: "Config link copied!", variant: "success", position: "top-center" });
  }

  async function handleSubmit() {
    const maps = ALL_MAPS.filter((m) => enabledMaps.has(m.name)).map(
      (m) => m.name,
    );
    setLoading(true);
    try {
      await handleLaunch({
        blueName: blueName.trim() || "Team A",
        redName: redName.trim() || "Team B",
        bestOf,
        maps,
      });
    } catch (e) {
      toast({
        message:
          e instanceof Error ? e.message : "An unexpected error occurred",
        variant: "error",
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex justify-center items-center">
      <div className="w-full max-w-160 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <HomeButton />
          <button
            type="button"
            onClick={handleCopyConfigLink}
            className="text-sm font-mono text-white/50 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors duration-150"
          >
            Copy Config Link
          </button>
        </div>
        <h1 className="text-7xl font-extrabold leading-none tracking-tight">
          Map <span className="text-tools-gold">Draft</span>
        </h1>

        <div className="flex flex-col gap-4 bg-tools-carbon border border-white/7 rounded-2xl p-6">
          <div className="text-sm font-mono tracking-widest uppercase">
            Teams
          </div>
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

        <div className="flex flex-col gap-4 bg-tools-carbon border border-white/7 rounded-2xl p-6">
          <div className="text-sm font-mono tracking-widest uppercase">
            Format
          </div>
          <div className="flex flex-row gap-3 w-full">
            {(Object.keys(SEQUENCE_MAP) as SequenceKey[]).map((seq) => {
              const selected = seq === bestOf;
              return (
                <button
                  key={seq}
                  className={`w-full border rounded-lg p-2 font-mono font-semibold transition-colors duration-200 uppercase ${
                    selected
                      ? "border-tools-gold/40 bg-tools-gold/6"
                      : "bg-tools-graphite border-white/7"
                  }`}
                  onClick={() => handleBestOfChange(seq)}
                >
                  {SEQUENCE_LABELS[seq]}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between h-6">
            <div className="text-sm font-mono tracking-widest uppercase">
              Map pool — click to toggle
            </div>
            <div className="flex items-center gap-3">
              {(enabledMaps.size !== CURRENT_MAP_POOL.length ||
                !CURRENT_MAP_POOL.every((m) => enabledMaps.has(m))) && (
                <button
                  onClick={resetEnabledMaps}
                  type="button"
                  className="text-sm text-tools-red border border-tools-red px-2 py-1 rounded-md hover:bg-white/10 transition-colors duration-150"
                >
                  Reset
                </button>
              )}
              <div
                className={`text-xs font-mono tracking-widest ${enabledMaps.size === 7 ? "text-tools-gold" : "text-tools-red"}`}
              >
                {enabledMaps.size} / 7
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ALL_MAPS.map((map) => {
              const on = enabledMaps.has(map.name);
              return (
                <button
                  key={map.name}
                  className={`border rounded-lg py-2.5 px-3.5 font-head text-sm font-medium flex items-center gap-2 transition-all duration-150 select-none text-left ${
                    on
                      ? "border-tools-gold/40  bg-tools-gold/6"
                      : "bg-tools-graphite border-white/7 "
                  }`}
                  onClick={() => toggleMap(map.name)}
                >
                  <span
                    className={`w-1.75 h-1.75 rounded-full shrink-0 transition-colors duration-150 ${
                      on ? "bg-tools-gold" : "bg-tools-border-bright"
                    }`}
                  />
                  {map.name}
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="flex justify-center items-center w-full h-14 bg-tools-gold text-black rounded-2xl font-head text-xl font-bold disabled:cursor-default! disabled:opacity-50 transition-opacity duration-300"
          onClick={handleSubmit}
          disabled={loading || enabledMaps.size !== 7}
        >
          {loading ? (
            <Spinner size="lg" primary="white" secondary="black" />
          ) : (
            "Create Map Draft Room →"
          )}
        </button>
      </div>
    </div>
  );
}
