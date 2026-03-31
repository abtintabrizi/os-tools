import { useState } from "react";
import type { DraftState, Side } from "@map-drafter/types";
import { BO3_SEQUENCE } from "@map-drafter/constants.ts";
import { deriveMapStatuses, getDeciderMap } from "@/utils";
import ConfirmModal from "@/components/ConfirmModal";

interface Props {
  state: DraftState;
  side: Side;
  onAction: (state: DraftState) => void;
  onReset: () => void;
}

export default function DraftPage({ state, side, onAction, onReset }: Props) {
  const [pending, setPending] = useState<string | null>(null);

  const { step, done, maps, actions, blueName, redName } = state;
  const currentStep =
    !done && step < BO3_SEQUENCE.length ? BO3_SEQUENCE[step] : null;
  const isMyTurn =
    currentStep !== null &&
    ((currentStep.team === "A" && side === "blue") ||
      (currentStep.team === "B" && side === "red"));

  const mapStatuses = deriveMapStatuses(state);
  const decider = getDeciderMap(state);

  const bans = {
    A: actions.find((a) => a.action === "ban" && a.team === "A"),
    B: actions.find((a) => a.action === "ban" && a.team === "B"),
  };
  const picks = actions.filter((a) => a.action === "pick");

  function handleMapClick(map: string) {
    if (!isMyTurn || mapStatuses[map] !== "available") return;
    setPending(map);
  }

  function handleConfirm() {
    if (!pending || !currentStep) return;
    const next: DraftState = {
      ...state,
      actions: [
        ...state.actions,
        { map: pending, team: currentStep.team, action: currentStep.action },
      ],
      step: state.step + 1,
      done: state.step + 1 >= BO3_SEQUENCE.length,
    };
    onAction(next);
    setPending(null);
  }

  function sideLabel(s: Side) {
    if (s === "blue") return blueName;
    if (s === "red") return redName;
    return "Spectating";
  }

  const sideBadgeClass =
    side === "blue"
      ? "bg-(--blue-dim) text-(--blue)"
      : side === "red"
        ? "bg-(--red-dim) text-(--red)"
        : "bg-(--bg3) text-(--text-muted)";

  return (
    <div className="min-h-screen flex flex-col relative z-1">
      {/* Header */}
      <header className="px-6 py-4 border-b border-(--border) flex items-center justify-between flex-wrap gap-3 bg-[rgba(10,10,15,0.85)] backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <span className={`font-mono text-[9px] font-bold tracking-[0.18em] uppercase py-1 px-2.5 rounded ${sideBadgeClass}`}>
            {side === "spectator" ? "Spectator" : side === "blue" ? "Blue" : "Red"}
          </span>
          <span className="text-sm font-bold text-(--text)">{sideLabel(side)}</span>
        </div>

        <StepTracker step={step} done={done} />

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-(--text-muted) tracking-[0.06em]">
            {blueName} vs {redName}
          </span>
          <button
            className="bg-transparent border border-(--border) rounded-md text-(--text-muted) font-mono text-[10px] tracking-widest py-1 px-2.5 transition-all duration-150 hover:border-(--border-bright) hover:text-(--text-dim)"
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      </header>

      {/* Status bar */}
      <div className="py-3 px-6 bg-(--bg2) border-b border-(--border) flex items-center justify-center gap-3">
        {done ? (
          <>
            <span className="font-mono text-[11px] tracking-[0.08em] text-(--text-muted)">
              Draft complete
            </span>
            <span className="font-mono text-[10px] tracking-[0.12em] py-0.75 px-2.5 rounded uppercase bg-[rgba(245,158,11,0.1)] text-(--gold)">
              Done
            </span>
          </>
        ) : currentStep ? (
          <>
            <span className="font-mono text-[11px] tracking-[0.08em] text-(--text-muted) [&_strong]:text-(--text)">
              <strong>{currentStep.team === "A" ? blueName : redName}</strong>
              {isMyTurn ? " — your turn" : " is choosing"}
            </span>
            <span
              className={`font-mono text-[10px] tracking-[0.12em] py-0.75 px-2.5 rounded uppercase ${
                currentStep.action === "ban"
                  ? "bg-[rgba(239,68,68,0.12)] text-[#f87171]"
                  : "bg-[rgba(34,197,94,0.1)] text-[#4ade80]"
              }`}
            >
              {currentStep.action.toUpperCase()}
            </span>
          </>
        ) : null}
      </div>

      {/* Main body */}
      <div className="flex-1 grid grid-cols-[220px_1fr_220px] max-[700px]:grid-cols-1">
        {/* Blue sidebar */}
        <aside className="p-5 border-r border-(--border) flex flex-col gap-1.5 max-[700px]:hidden">
          <div className="text-[11px] font-mono tracking-[0.15em] uppercase mb-1.5 font-bold text-(--blue)">
            {blueName}
          </div>
          <div className="text-[9px] font-mono tracking-[0.2em] text-(--text-muted) uppercase mt-2.5 mb-0.5">Ban</div>
          <ResultSlot map={bans.A?.map} type="ban" label="Ban 1" />
          <div className="text-[9px] font-mono tracking-[0.2em] text-(--text-muted) uppercase mt-2.5 mb-0.5">Pick</div>
          <ResultSlot map={picks[0]?.map} type="pick" label="Game 1" />
        </aside>

        {/* Center */}
        <main className="p-5 flex flex-col">
          {done ? (
            <DonePanel
              g1={picks[0]?.map ?? "—"}
              g2={picks[1]?.map ?? "—"}
              g3={decider ?? "—"}
              blueName={blueName}
              redName={redName}
              onReset={onReset}
            />
          ) : (
            <>
              <div className="text-[9px] font-mono tracking-[0.25em] text-(--text-muted) uppercase text-center mb-4">
                Map pool
              </div>
              <div className="flex flex-col gap-2">
                {maps.map((map) => {
                  const status = mapStatuses[map];
                  const clickable = status === "available" && isMyTurn;

                  const cardClass = [
                    "border rounded-[10px] py-3.5 px-[18px] flex items-center justify-between w-full text-left transition-all duration-200 relative overflow-hidden",
                    "before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.75 before:bg-transparent before:transition-colors before:duration-200",
                    status === "available" && clickable
                      ? "bg-(--bg2) border-[rgba(245,158,11,0.3)] animate-[pulseBorder_2s_infinite] hover:border-(--border-bright) hover:bg-(--bg3) hover:translate-x-0.5 hover:before:bg-(--gold)"
                      : status === "banned"
                        ? "opacity-40 bg-[#18181a] border-transparent cursor-default"
                        : status === "picked-g1" || status === "picked-g2"
                          ? "bg-[rgba(34,197,94,0.04)] border-[rgba(34,197,94,0.2)] cursor-not-allowed"
                          : status === "picked-g3"
                            ? "bg-[rgba(245,158,11,0.05)] border-[rgba(245,158,11,0.25)] cursor-not-allowed"
                            : "bg-(--bg2) border-(--border)",
                  ].join(" ");

                  const mapNameClass =
                    status === "banned"
                      ? "text-[15px] font-semibold text-(--text-muted) line-through"
                      : "text-[15px] font-semibold text-(--text)";

                  const mapStatusClass = [
                    "text-[9px] font-mono tracking-[0.15em] uppercase py-0.75 px-2.25 rounded",
                    status === "available" ? "hidden" : "",
                    status === "banned" ? "bg-[rgba(239,68,68,0.1)] text-[#f87171]" : "",
                    status === "picked-g1" || status === "picked-g2"
                      ? "bg-[rgba(34,197,94,0.1)] text-[#4ade80]"
                      : "",
                    status === "picked-g3" ? "bg-[rgba(245,158,11,0.12)] text-(--gold)" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      key={map}
                      className={cardClass}
                      onClick={() => handleMapClick(map)}
                      disabled={!clickable}
                    >
                      <span className={mapNameClass}>{map}</span>
                      <span className={mapStatusClass}>
                        {status === "banned"
                          ? "Banned"
                          : status === "picked-g1"
                            ? "Game 1"
                            : status === "picked-g2"
                              ? "Game 2"
                              : status === "picked-g3"
                                ? "Decider"
                                : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </main>

        {/* Red sidebar */}
        <aside className="p-5 border-l border-(--border) flex flex-col gap-1.5 max-[700px]:hidden">
          <div className="text-[11px] font-mono tracking-[0.15em] uppercase mb-1.5 font-bold text-(--red)">
            {redName}
          </div>
          <div className="text-[9px] font-mono tracking-[0.2em] text-(--text-muted) uppercase mt-2.5 mb-0.5">Ban</div>
          <ResultSlot map={bans.B?.map} type="ban" label="Ban 1" />
          <div className="text-[9px] font-mono tracking-[0.2em] text-(--text-muted) uppercase mt-2.5 mb-0.5">Pick</div>
          <ResultSlot map={picks[1]?.map} type="pick" label="Game 2" />
        </aside>
      </div>

      {pending && currentStep && (
        <ConfirmModal
          map={pending}
          action={currentStep.action}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}

function ResultSlot({
  map,
  type,
  label,
}: {
  map?: string;
  type: "ban" | "pick";
  label: string;
}) {
  const filled = !!map;

  const slotClass = [
    "border rounded-lg py-2.5 px-3 min-h-11 flex items-center gap-2 relative transition-all duration-300",
    filled && type === "ban"
      ? "border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)]"
      : filled && type === "pick"
        ? "border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.06)]"
        : "bg-(--bg3) border-(--border)",
  ].join(" ");

  const iconClass = [
    "w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0",
    type === "ban"
      ? "bg-[rgba(239,68,68,0.15)] text-[#f87171]"
      : "bg-[rgba(34,197,94,0.12)] text-[#4ade80]",
  ].join(" ");

  const mapClass = filled
    ? type === "ban"
      ? "text-[13px] font-semibold flex-1 text-[#f87171] line-through decoration-[rgba(239,68,68,0.4)]"
      : "text-[13px] font-semibold flex-1 text-[#4ade80]"
    : "text-[13px] font-semibold flex-1 text-(--text-dim)";

  return (
    <div className={slotClass}>
      <span className={iconClass}>{type === "ban" ? "✕" : "✓"}</span>
      <span className={mapClass}>{map ?? "—"}</span>
      <span className="text-[8px] font-mono tracking-[0.15em] uppercase text-(--text-muted) opacity-50">
        {label}
      </span>
    </div>
  );
}

function StepTracker({ step, done }: { step: number; done: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {BO3_SEQUENCE.map((s, i) => {
        const base = "w-5 h-1 rounded-sm transition-colors duration-300";
        let color: string;
        if (i < step || done) {
          color = s.action === "ban" ? "bg-[rgba(239,68,68,0.5)]" : "bg-[rgba(34,197,94,0.5)]";
        } else if (i === step && !done) {
          color = "bg-(--gold)";
        } else {
          color = "bg-(--bg3)";
        }
        return <span key={i} className={`${base} ${color}`} />;
      })}
    </div>
  );
}

function DonePanel({
  g1,
  g2,
  g3,
  blueName,
  redName,
  onReset,
}: {
  g1: string;
  g2: string;
  g3: string;
  blueName: string;
  redName: string;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="text-[11px] font-mono tracking-[0.2em] text-(--gold) uppercase text-center mb-1">
        Draft complete
      </div>

      <div className="bg-(--bg2) border border-[rgba(59,130,246,0.3)] rounded-xl p-5 px-6 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-(--text-muted) mb-1">Game 1</div>
          <div className="text-xl font-bold text-(--text)">{g1}</div>
        </div>
        <div className="text-[11px] font-mono tracking-widest text-(--blue)">{blueName} pick</div>
      </div>

      <div className="bg-(--bg2) border border-[rgba(239,68,68,0.3)] rounded-xl p-5 px-6 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-(--text-muted) mb-1">Game 2</div>
          <div className="text-xl font-bold text-(--text)">{g2}</div>
        </div>
        <div className="text-[11px] font-mono tracking-widest text-(--red)">{redName} pick</div>
      </div>

      <div className="bg-[rgba(245,158,11,0.04)] border border-[rgba(245,158,11,0.35)] rounded-xl p-5 px-6 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-(--text-muted) mb-1">Game 3 (decider)</div>
          <div className="text-xl font-bold text-(--text)">{g3}</div>
        </div>
        <div className="text-[11px] font-mono tracking-widest text-(--gold)">Decider</div>
      </div>

      <button
        className="mt-1 py-3 px-3 bg-transparent border border-(--border) rounded-lg font-head text-[13px] font-semibold text-(--text-muted) transition-all duration-150 w-full hover:border-(--border-bright) hover:text-(--text)"
        onClick={onReset}
      >
        New draft
      </button>
    </div>
  );
}
