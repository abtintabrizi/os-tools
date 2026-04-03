import { useState } from "react";
import Spinner from "@/features/common/components/Spinner";
import {
  ALL_MAPS,
  AWAKENING_CONFLICTS,
  Awakening,
} from "@/features/common/constants";
import AwakeningPicker from "@/features/striker-draft/components/AwakeningPicker";

export default function SetupPage() {
  const [blueName, setBlueName] = useState("");
  const [redName, setRedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState("");
  const [awakening, setAwakening] = useState("random");
  const [customAwakenings, setCustomAwakenings] = useState({
    first: "",
    second: "",
  });

  const handleAwakeningChange = (key: "first" | "second", value: string) => {
    setCustomAwakenings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-screen flex justify-center items-center">
      <div className="w-full max-w-160 flex flex-col gap-3">
        <h1 className="text-7xl font-extrabold leading-none tracking-tight">
          Striker
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

        <div className="flex flex-col gap-6 bg-tools-carbon border border-white/7 rounded-2xl p-6">
          <div className="flex flex-col gap-4">
            <div className="text-sm font-mono tracking-widest uppercase">
              Map
            </div>
            <select
              value={map}
              onChange={(e) => setMap(e.target.value)}
              className="border border-white/7 bg-tools-graphite p-3 font-bold rounded-lg cursor-pointer transition-colors duration-200 focus:border-white/15"
            >
              <option value="">Select a map</option>
              {ALL_MAPS.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-sm font-mono tracking-widest uppercase">
              Awakenings
            </div>
            <div className="flex flex-row gap-3 w-full">
              <button
                className={`w-full border rounded-lg p-2 font-mono font-semibold transition-colors duration-200 uppercase ${
                  awakening === "random"
                    ? "border-tools-gold/40 bg-tools-gold/6"
                    : "bg-tools-graphite border-white/7"
                }`}
                onClick={() => setAwakening("random")}
              >
                Random
              </button>
              <button
                className={`w-full border rounded-lg p-2 font-mono font-semibold transition-colors duration-200 uppercase ${
                  awakening === "custom"
                    ? "border-tools-gold/40 bg-tools-gold/6"
                    : "bg-tools-graphite border-white/7"
                }`}
                onClick={() => setAwakening("custom")}
              >
                Custom
              </button>
            </div>
            {awakening === "custom" && (
              <div className="flex gap-3">
                <AwakeningPicker
                  value={customAwakenings.first}
                  onChange={(v) => handleAwakeningChange("first", v)}
                  exclude={
                    customAwakenings.second
                      ? [
                          customAwakenings.second,
                          ...(AWAKENING_CONFLICTS[
                            customAwakenings.second as Awakening
                          ] ?? []),
                        ]
                      : []
                  }
                />
                <AwakeningPicker
                  value={customAwakenings.second}
                  onChange={(v) => handleAwakeningChange("second", v)}
                  exclude={
                    customAwakenings.first
                      ? [
                          customAwakenings.first,
                          ...(AWAKENING_CONFLICTS[
                            customAwakenings.first as Awakening
                          ] ?? []),
                        ]
                      : []
                  }
                />
              </div>
            )}
          </div>
        </div>

        <button
          className="flex justify-center items-center w-full h-14 bg-tools-gold text-black rounded-2xl font-head text-xl font-bold disabled:cursor-default! disabled:opacity-50 transition-opacity duration-300"
          disabled={
            loading ||
            !map ||
            (awakening === "custom" &&
              (!customAwakenings.first || !customAwakenings.second))
          }
        >
          {loading ? (
            <Spinner size="lg" primary="white" secondary="black" />
          ) : (
            "Create Striker Draft Room →"
          )}
        </button>
      </div>
    </div>
  );
}
