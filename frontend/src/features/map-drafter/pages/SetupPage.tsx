import { useState } from "react";
import type { DraftState } from "@map-drafter/types";
import { ALL_MAPS } from "@/common/constants";

interface Props {
  onLaunch: (state: DraftState) => void;
}

function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function SetupPage({ onLaunch }: Props) {
  const [blueName, setBlueName] = useState("");
  const [redName, setRedName] = useState("");
  const [enabledMaps, setEnabledMaps] = useState<Set<string>>(
    new Set(ALL_MAPS),
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

  async function handleLaunch() {
    const maps = ALL_MAPS.filter((m) => enabledMaps.has(m));
    if (maps.length < 5) {
      alert("Enable at least 5 maps for a Bo3 draft.");
      return;
    }
    setLoading(true);
    const state: DraftState = {
      roomId: generateRoomId(),
      blueName: blueName.trim() || "Team A",
      redName: redName.trim() || "Team B",
      maps,
      step: 0,
      actions: [],
      done: false,
    };
    await onLaunch(state);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="w-full max-w-160">
        <div className="text-[11px] font-mono tracking-[0.25em] text-(--text-muted) uppercase mb-8 flex items-center gap-3 before:content-[''] before:inline-block before:w-6 before:h-0.5 before:bg-(--gold) before:shrink-0">
          Omega Strikers
        </div>
        <h1 className="text-[clamp(36px,7vw,64px)] font-extrabold leading-none tracking-tight mb-2 text-(--text)">
          Map
          <br />
          <em className="not-italic text-(--gold)">Draft</em>
        </h1>
        <p className="font-mono text-xs text-(--text-muted) tracking-[0.08em] mb-10">
          // Best of 3 · Online
        </p>

        <div className="bg-(--bg2) border border-(--border) rounded-2xl p-6 mb-4">
          <div className="text-[10px] font-mono tracking-[0.2em] text-(--text-muted) uppercase mb-4">
            Teams
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold tracking-[0.12em] py-0.5 px-1.75 rounded pointer-events-none bg-(--blue-dim) text-(--blue)">
                Blue
              </span>
              <input
                className="w-full bg-(--bg3) border border-(--border) rounded-lg py-2.5 pr-3 pl-16 font-head text-[15px] font-semibold text-(--text) outline-none transition-colors duration-200 focus:border-(--border-bright)"
                type="text"
                placeholder="Team A"
                maxLength={24}
                value={blueName}
                onChange={(e) => setBlueName(e.target.value)}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold tracking-[0.12em] py-0.5 px-1.75 rounded pointer-events-none bg-(--red-dim) text-(--red)">
                Red
              </span>
              <input
                className="w-full bg-(--bg3) border border-(--border) rounded-lg py-2.5 pr-3 pl-16 font-head text-[15px] font-semibold text-(--text) outline-none transition-colors duration-200 focus:border-(--border-bright)"
                type="text"
                placeholder="Team B"
                maxLength={24}
                value={redName}
                onChange={(e) => setRedName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-(--bg2) border border-(--border) rounded-2xl p-6 mb-4">
          <div className="text-[10px] font-mono tracking-[0.2em] text-(--text-muted) uppercase mb-4">
            Map pool — click to toggle
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2">
            {ALL_MAPS.map((map) => {
              const on = enabledMaps.has(map);
              return (
                <button
                  key={map}
                  className={`border rounded-lg py-2.5 px-3.5 font-head text-[13px] font-medium flex items-center gap-2 transition-all duration-150 select-none text-left ${
                    on
                      ? "border-[rgba(245,158,11,0.4)] text-(--text) bg-[rgba(245,158,11,0.06)]"
                      : "bg-(--bg3) border-(--border) text-(--text-muted)"
                  }`}
                  onClick={() => toggleMap(map)}
                >
                  <span
                    className={`w-1.75 h-1.75 rounded-full shrink-0 transition-colors duration-150 ${
                      on ? "bg-(--gold)" : "bg-(--border-bright)"
                    }`}
                  />
                  {map}
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="w-full py-4 bg-(--gold) text-black border-none rounded-[10px] font-head text-[15px] font-extrabold tracking-[0.04em] mt-4 transition-all duration-150 hover:opacity-90 hover:-translate-y-px active:scale-[0.99]"
          onClick={handleLaunch}
          disabled={loading}
        >
          {loading ? "Creating room..." : "Create Draft Room →"}
        </button>
      </div>
    </div>
  );
}
