import { changelog } from "@/features/common/constants/changelog";

export default function Changelog() {
  return (
    <div className="w-full max-w-160 bg-tools-carbon border border-white/7 rounded-2xl flex flex-col max-h-[80vh]">
      <h2 className="text-lg py-4 mx-6 border-b font-semibold text-white/40 uppercase shrink-0">
        Changelog
      </h2>
      <div className="flex-1 min-h-0 px-6 py-4 overflow-y-auto flex flex-col gap-4">
        {changelog.map((entry, i) => (
          <div key={entry.date}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-tools-gold font-semibold text-sm">
                {entry.date}
              </span>
              {i === 0 && (
                <div className="px-1 py-0.5 border border-tools-green text-tools-green rounded-lg text-xs">
                  NEW!
                </div>
              )}
            </div>
            <ul className="flex flex-col gap-0.5">
              {entry.notes.map((note) => (
                <li
                  key={note}
                  className="text-white/60 text-sm font-mono tracking-tighter"
                >
                  — {note}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
