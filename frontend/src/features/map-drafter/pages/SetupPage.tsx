import { useState } from "react";
import { ALL_MAPS } from "@/common/constants";
import { useDraftContext } from "@/features/map-drafter/context/DraftContext";
import { useToast } from "@/common/components/Toast";
import Spinner from "@/common/components/Spinner";
import { SEQUENCE_MAP } from "@map-drafter/constants.ts";
import { SequenceKey } from "@/features/map-drafter/types";

export default function SetupPage() {
  const { toast } = useToast();
  const { handleLaunch } = useDraftContext();
  const [blueName, setBlueName] = useState("");
  const [redName, setRedName] = useState("");
  const [bestOf, setBestOf] = useState<SequenceKey>("bo3");
  const [enabledMaps, setEnabledMaps] = useState<Set<string>>(
    new Set(ALL_MAPS.map((m) => m.name)),
  );
  const [loading, setLoading] = useState(false);

  function toggleMap(map: string) {
    setEnabledMaps((prev) => {
      const next = new Set(prev);
      if (next.has(map)) next.delete(map);
      else next.add(map);
      return next;
    });
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
        <h1 className="text-7xl font-extrabold leading-none tracking-tight">
          Map
          <br />
          <span className="text-tools-gold">Draft</span>
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
                  onClick={() => setBestOf(seq)}
                >
                  {seq}
                </button>
              );
            })}
          </div>

          <div className="text-sm font-mono tracking-widest uppercase">
            Map pool — click to toggle
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
          className="flex justify-center items-center w-full h-14 bg-tools-gold text-black rounded-2xl font-head text-xl font-bold"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <Spinner size="lg" primary="white" secondary="black" />
          ) : (
            "Create Draft Room →"
          )}
        </button>
      </div>
    </div>
  );
}
