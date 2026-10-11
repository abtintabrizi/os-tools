import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

interface LobbyLinkProps {
  title: string;
  url: string;
  copyLabel: string;
  actionLabel: string;
  onEnter: () => void;
  tone?: "blue" | "red" | "neutral" | "replay";
  available?: boolean;
  helperText?: string;
}

const titleColors = {
  blue: "text-tools-blue",
  red: "text-tools-red",
  neutral: "",
  replay: "text-tools-gold",
};
const buttonColors = {
  blue: "border-tools-blue/35 text-tools-blue bg-tools-blue/6 aria-[disabled=false]:hover:bg-tools-blue/14",
  red: "border-tools-red/35 text-tools-red bg-tools-red/6 aria-[disabled=false]:hover:bg-tools-red/14",
  neutral:
    "border-white/7 aria-[disabled=false]:hover:border-white/15 aria-[disabled=false]:hover:bg-white/5",
  replay:
    "border-white/7 aria-[disabled=false]:hover:border-white/15 aria-[disabled=false]:hover:bg-white/5",
};

export default function LobbyLink({
  title,
  url,
  copyLabel,
  actionLabel,
  onEnter,
  tone = "neutral",
  available = true,
  helperText,
}: LobbyLinkProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    },
    [],
  );

  async function copy() {
    await navigator.clipboard.writeText(url);
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    setCopied(true);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className={`text-xs font-mono font-bold tracking-widest ${available ? titleColors[tone] : "text-white/40"}`}
        >
          {title}
        </div>
        {helperText && <p className="text-xs text-white/50">{helperText}</p>}
      </div>
      <div className="flex items-stretch gap-2.5">
        <div className="relative flex-1 min-w-0">
          <button
            type="button"
            onClick={copy}
            aria-label={copyLabel}
            title="Click to copy link"
            className={`w-full h-full text-left bg-tools-graphite border border-white/7 hover:border-white/20 rounded-lg py-2.5 px-3 font-mono text-xs break-all leading-relaxed transition-colors ${available ? "" : "text-white/40"}`}
          >
            {url}
          </button>
          {copied && (
            <span
              role="status"
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-3 z-10 rounded-md border border-tools-gold/30 bg-tools-carbon px-3 py-1 text-xs font-bold text-tools-gold shadow-lg"
            >
              Copied!
            </span>
          )}
        </div>
        <a
          href={available ? url : undefined}
          aria-disabled={!available}
          tabIndex={available ? undefined : -1}
          onClick={(event) => {
            if (!available) {
              event.preventDefault();
              return;
            }
            if (
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey ||
              event.altKey ||
              event.button !== 0
            )
              return;
            event.preventDefault();
            onEnter();
          }}
          aria-label={actionLabel}
          title={available ? actionLabel : "Replay unavailable"}
          className={`px-2.5 py-2.5 rounded-lg shrink-0 flex items-center justify-center transition-all duration-150 border aria-disabled:opacity-40 aria-disabled:cursor-default! ${buttonColors[tone]}`}
        >
          <ArrowRight size={20} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
