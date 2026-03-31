import type { DraftState, Side } from "@map-drafter/types";

interface Props {
  state: DraftState;
  onPick: (side: Side) => void;
}

export default function SidePickPage({ state, onPick }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 relative z-1">
      <div className="text-[13px] font-mono tracking-[0.15em] text-tools-text-muted uppercase">
        Who are you?
      </div>
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          className="w-55 py-8 px-6 rounded-[14px] border border-tools-border bg-tools-bg2 text-center transition-all duration-200 hover:-translate-y-0.75 hover:border-tools-blue hover:bg-tools-blue/15"
          onClick={() => onPick("blue")}
        >
          <div className="text-[11px] font-mono tracking-[0.2em] uppercase mb-2 text-tools-blue">
            Blue side
          </div>
          <div className="text-[22px] font-bold text-tools-text">{state.blueName}</div>
        </button>
        <button
          className="w-55 py-8 px-6 rounded-[14px] border border-tools-border bg-tools-bg2 text-center transition-all duration-200 hover:-translate-y-0.75 hover:border-tools-red hover:bg-tools-red/15"
          onClick={() => onPick("red")}
        >
          <div className="text-[11px] font-mono tracking-[0.2em] uppercase mb-2 text-tools-red">
            Red side
          </div>
          <div className="text-[22px] font-bold text-tools-text">{state.redName}</div>
        </button>
      </div>
      <button
        className="font-mono text-[11px] text-tools-text-muted tracking-widest underline underline-offset-[3px] bg-transparent border-none transition-colors duration-150 hover:text-tools-text-dim"
        onClick={() => onPick("spectator")}
      >
        Watch as spectator
      </button>
    </div>
  );
}
