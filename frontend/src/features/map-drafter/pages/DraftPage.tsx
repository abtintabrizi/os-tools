import { useState } from "react";
import { BO3_SEQUENCE } from "@map-drafter/constants.ts";
import { deriveMapStatuses, getDeciderMap } from "@/utils";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";
import { useDraftContext } from "@/features/map-drafter/context/DraftContext";

export default function DraftPage() {
  const { state, side, loading, handleAction, handleReset } = useDraftContext();
  const [pending, setPending] = useState<string | null>(null);

  if (loading) return <LoadingScreen message="Connecting to draft..." />;
  if (!state) return <ErrorScreen message="Room not found. Check your link." />;

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

  async function handleConfirm() {
    if (!pending) return;
    await handleAction(pending);
    setPending(null);
  }

  function sideLabel() {
    if (side === "blue") return blueName;
    if (side === "red") return redName;
    return "Spectating";
  }

  const sideBadgeClass =
    side === "blue"
      ? "bg-tools-blue-dim text-tools-blue"
      : side === "red"
        ? "bg-tools-red-dim text-tools-red"
        : "bg-tools-bg3 text-tools-text-muted";

  return (
    <div className="min-h-screen flex flex-col relative z-1">
      {/* Header */}
      <header className="px-6 py-4 border-b border-tools-border flex items-center justify-between flex-wrap gap-3 bg-tools-bg/85 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <span
            className={`font-mono text-[9px] font-bold tracking-[0.18em] uppercase py-1 px-2.5 rounded ${sideBadgeClass}`}
          >
            {side === "spectator" ? "Spectator" : side === "blue" ? "Blue" : "Red"}
          </span>
          <span className="text-sm font-bold text-tools-text">{sideLabel()}</span>
        </div>

        <StepTracker step={step} done={done} />

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-tools-text-muted tracking-[0.06em]">
            {blueName} vs {redName}
          </span>
          <button
            className="bg-transparent border border-tools-border rounded-md text-tools-text-muted font-mono text-[10px] tracking-widest py-1 px-2.5 transition-all duration-150 hover:border-tools-border-bright hover:text-tools-text-dim"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </header>

      {/* Status bar */}
      <div className="py-3 px-6 bg-tools-bg2 border-b border-tools-border flex items-center justify-center gap-3">
        {done ? (
          <>
            <span className="font-mono text-[11px] tracking-[0.08em] text-tools-text-muted">
              Draft complete
            </span>
            <span className="font-mono text-[10px] tracking-[0.12em] py-0.75 px-2.5 rounded uppercase bg-tools-gold/10 text-tools-gold">
              Done
            </span>
          </>
        ) : currentStep ? (
          <>
            <span className="font-mono text-[11px] tracking-[0.08em] text-tools-text-muted [&_strong]:text-tools-text">
              <strong>{currentStep.team === "A" ? blueName : redName}</strong>
              {isMyTurn ? " — your turn" : " is choosing"}
            </span>
            <span
              className={`font-mono text-[10px] tracking-[0.12em] py-0.75 px-2.5 rounded uppercase ${
                currentStep.action === "ban"
                  ? "bg-tools-red/12 text-tools-red-light"
                  : "bg-tools-green/10 text-tools-green-light"
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
        <aside className="p-5 border-r border-tools-border flex flex-col gap-1.5 max-[700px]:hidden">
          <div className="text-[11px] font-mono tracking-[0.15em] uppercase mb-1.5 font-bold text-tools-blue">
            {blueName}
          </div>
          <div className="text-[9px] font-mono tracking-[0.2em] text-tools-text-muted uppercase mt-2.5 mb-0.5">
            Ban
          </div>
          <ResultSlot map={bans.A?.map} type="ban" label="Ban 1" />
          <div className="text-[9px] font-mono tracking-[0.2em] text-tools-text-muted uppercase mt-2.5 mb-0.5">
            Pick
          </div>
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
              onReset={handleReset}
            />
          ) : (
            <>
              <div className="text-[9px] font-mono tracking-[0.25em] text-tools-text-muted uppercase text-center mb-4">
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
                      ? "bg-tools-bg2 border-tools-gold/30 animate-[pulseBorder_2s_infinite] hover:border-tools-border-bright hover:bg-tools-bg3 hover:translate-x-0.5 hover:before:bg-tools-gold"
                      : status === "banned"
                        ? "opacity-40 bg-tools-bg3 border-transparent cursor-default"
                        : status === "picked-g1" || status === "picked-g2"
                          ? "bg-tools-green/4 border-tools-green/20 cursor-not-allowed"
                          : status === "picked-g3"
                            ? "bg-tools-gold/5 border-tools-gold/25 cursor-not-allowed"
                            : "bg-tools-bg2 border-tools-border",
                  ].join(" ");

                  const mapNameClass =
                    status === "banned"
                      ? "text-[15px] font-semibold text-tools-text-muted line-through"
                      : "text-[15px] font-semibold text-tools-text";

                  const mapStatusClass = [
                    "text-[9px] font-mono tracking-[0.15em] uppercase py-0.75 px-2.25 rounded",
                    status === "available" ? "hidden" : "",
                    status === "banned" ? "bg-tools-red/10 text-tools-red-light" : "",
                    status === "picked-g1" || status === "picked-g2"
                      ? "bg-tools-green/10 text-tools-green-light"
                      : "",
                    status === "picked-g3" ? "bg-tools-gold/12 text-tools-gold" : "",
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
        <aside className="p-5 border-l border-tools-border flex flex-col gap-1.5 max-[700px]:hidden">
          <div className="text-[11px] font-mono tracking-[0.15em] uppercase mb-1.5 font-bold text-tools-red">
            {redName}
          </div>
          <div className="text-[9px] font-mono tracking-[0.2em] text-tools-text-muted uppercase mt-2.5 mb-0.5">
            Ban
          </div>
          <ResultSlot map={bans.B?.map} type="ban" label="Ban 1" />
          <div className="text-[9px] font-mono tracking-[0.2em] text-tools-text-muted uppercase mt-2.5 mb-0.5">
            Pick
          </div>
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
      ? "border-tools-red/25 bg-tools-red/6"
      : filled && type === "pick"
        ? "border-tools-green/25 bg-tools-green/6"
        : "bg-tools-bg3 border-tools-border",
  ].join(" ");

  const iconClass = [
    "w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0",
    type === "ban"
      ? "bg-tools-red/15 text-tools-red-light"
      : "bg-tools-green/12 text-tools-green-light",
  ].join(" ");

  const mapClass = filled
    ? type === "ban"
      ? "text-[13px] font-semibold flex-1 text-tools-red-light line-through decoration-tools-red/40"
      : "text-[13px] font-semibold flex-1 text-tools-green-light"
    : "text-[13px] font-semibold flex-1 text-tools-text-dim";

  return (
    <div className={slotClass}>
      <span className={iconClass}>{type === "ban" ? "✕" : "✓"}</span>
      <span className={mapClass}>{map ?? "—"}</span>
      <span className="text-[8px] font-mono tracking-[0.15em] uppercase text-tools-text-muted opacity-50">
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
          color = s.action === "ban" ? "bg-tools-red/50" : "bg-tools-green/50";
        } else if (i === step && !done) {
          color = "bg-tools-gold";
        } else {
          color = "bg-tools-bg3";
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
      <div className="text-[11px] font-mono tracking-[0.2em] text-tools-gold uppercase text-center mb-1">
        Draft complete
      </div>

      <div className="bg-tools-bg2 border border-tools-blue/30 rounded-xl p-5 px-6 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-tools-text-muted mb-1">
            Game 1
          </div>
          <div className="text-xl font-bold text-tools-text">{g1}</div>
        </div>
        <div className="text-[11px] font-mono tracking-widest text-tools-blue">
          {blueName} pick
        </div>
      </div>

      <div className="bg-tools-bg2 border border-tools-red/30 rounded-xl p-5 px-6 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-tools-text-muted mb-1">
            Game 2
          </div>
          <div className="text-xl font-bold text-tools-text">{g2}</div>
        </div>
        <div className="text-[11px] font-mono tracking-widest text-tools-red">
          {redName} pick
        </div>
      </div>

      <div className="bg-tools-gold/4 border border-tools-gold/35 rounded-xl p-5 px-6 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-tools-text-muted mb-1">
            Game 3 (decider)
          </div>
          <div className="text-xl font-bold text-tools-text">{g3}</div>
        </div>
        <div className="text-[11px] font-mono tracking-widest text-tools-gold">
          Decider
        </div>
      </div>

      <button
        className="mt-1 py-3 px-3 bg-transparent border border-tools-border rounded-lg font-head text-[13px] font-semibold text-tools-text-muted transition-all duration-150 w-full hover:border-tools-border-bright hover:text-tools-text"
        onClick={onReset}
      >
        New draft
      </button>
    </div>
  );
}
