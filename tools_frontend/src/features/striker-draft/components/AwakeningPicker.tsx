import { type Awakening, CURRENT_AWAKENING_POOL } from "@os-tools/shared";
import { useEffect, useRef, useState } from "react";

import { AWAKENING_ICONS } from "../../common/constants/constants";

interface Props {
  value: Awakening | "";
  onChange: (value: Awakening) => void;
  exclude?: Awakening[];
  placeholder?: string;
}

export default function AwakeningPicker({ value, onChange, exclude = [], placeholder = "Select an awakening" }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const poolItems = CURRENT_AWAKENING_POOL.filter((awakening) => {
    return !exclude.includes(awakening);
  }).sort((a, b) => {
    return a.localeCompare(b);
  });
  const filtered = poolItems.filter((awakening) => {
    return awakening.toLowerCase().includes(search.toLowerCase());
  });
  const selectedIcon = AWAKENING_ICONS[value as Awakening];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        className="w-full flex items-center gap-2.5 border border-white/7 bg-tools-graphite p-3 font-bold rounded-lg cursor-pointer transition-colors duration-200 hover:border-white/15"
        onClick={() => setOpen((o) => !o)}
      >
        {selectedIcon ? (
          <>
            <img src={selectedIcon} alt={value} className="w-6 h-6 object-contain shrink-0" />
            <span className="truncate flex-1 text-left">{value}</span>
          </>
        ) : (
          <span className="text-white/40 font-normal flex-1 text-left">{placeholder}</span>
        )}
        <svg
          className={`w-4 h-4 shrink-0 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 bottom-full mb-1 w-full bg-tools-carbon border border-white/7 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/7">
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-tools-graphite border border-white/7 rounded px-3 py-1.5 text-sm outline-none focus:border-white/15"
            />
          </div>
          <div className="grid grid-cols-4 gap-1 p-2 max-h-72 overflow-y-auto">
            {filtered.map((a) => (
              <button
                key={a}
                type="button"
                title={a}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors duration-150 cursor-pointer ${
                  value === a
                    ? "bg-tools-gold/10 border border-tools-gold/40"
                    : "hover:bg-white/5 border border-transparent"
                }`}
                onClick={() => {
                  onChange(a);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <img src={AWAKENING_ICONS[a]} alt={a} className="w-10 h-10 object-contain" />
                <span className="text-xs text-center leading-tight line-clamp-2">{a}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-4 py-6 text-center text-sm text-white/30">No awakenings found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
