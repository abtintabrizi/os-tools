import { useState } from "react";

interface LobbyReplayLinkProps {
  url: string;
  available: boolean;
  completed: boolean;
}

export default function LobbyReplayLink({
  url,
  available,
  completed,
}: LobbyReplayLinkProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const buttonClass =
    "px-2.5 py-2.5 rounded-lg font-head text-sm font-bold transition-all duration-150 border border-white/7 disabled:opacity-40 disabled:cursor-default! enabled:hover:border-white/15 enabled:hover:bg-white/5";

  return (
    <>
      <div className="h-px bg-tools-gold my-3" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`text-xs font-mono font-bold tracking-widest ${available ? "text-tools-gold" : "text-white/40"}`}
          >
            Replay
          </div>
          <p className="text-xs text-white/50">
            {completed ? "Draft complete" : "Draft incomplete"}
            {" · "}
            {available ? "Replay available" : "Replay unavailable"}
          </p>
        </div>
        <div
          className={`bg-tools-graphite border border-white/7 rounded-lg py-2.5 px-3 font-mono text-xs break-all leading-relaxed ${available ? "" : "text-white/40"}`}
        >
          {url}
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button type="button" onClick={copy} className={buttonClass}>
            {copied ? "Copied!" : "Copy replay link"}
          </button>
          <button
            type="button"
            disabled={!available}
            onClick={() => window.location.assign(url)}
            className={buttonClass}
          >
            Watch Replay
          </button>
        </div>
      </div>
    </>
  );
}
