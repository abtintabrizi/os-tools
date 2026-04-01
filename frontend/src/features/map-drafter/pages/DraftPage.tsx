import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEQUENCE_MAP } from "@map-drafter/constants.ts";
import { deriveMapStatuses } from "@/utils";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";
import { useDraftContext } from "@/features/map-drafter/context/DraftContext";
import { StepTracker } from "@/features/map-drafter/components/StepTracker";
import ResultCard from "@/features/map-drafter/components/ResultCard";
import DonePanel from "@/features/map-drafter/components/DonePanel";

export default function DraftPage() {
  const { state, side, loading, handleAction, handleReset } = useDraftContext();
  const [pending, setPending] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("room") || !params.get("side")) {
      navigate("/map-draft", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingScreen message="Connecting to draft..." />;
  if (!state) return <ErrorScreen message="Room not found. Check your link." />;

  const { step, done, maps, actions, blueName, redName } = state;
  const sequence = SEQUENCE_MAP[state.bestOf];
  const currentSeqStep =
    !done && step < sequence.length ? sequence[step] : null;
  const currentTeam = currentSeqStep
    ? currentSeqStep.team === "blue"
      ? blueName
      : redName
    : null;
  const isMyTurn = currentSeqStep !== null && currentSeqStep.team === side;

  const mapStatuses = deriveMapStatuses(state);

  const blueActions = actions.filter((a) => a.team === blueName);
  const redActions = actions.filter((a) => a.team === redName);

  const blueSeqSteps = sequence
    .map((s, globalIdx) => ({ ...s, globalIdx }))
    .filter((s) => s.team === "blue");
  const redSeqSteps = sequence
    .map((s, globalIdx) => ({ ...s, globalIdx }))
    .filter((s) => s.team === "red");

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

  const blueBadgeClass = "bg-tools-blue-dim text-tools-blue";
  const redBadgeClass = "bg-tools-red-dim text-tools-red";

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="grid grid-cols-3 px-6 py-4 border-b border-white/7 bg-tools-void/70">
        <div className="flex items-center gap-2.5">
          {side !== "spectator" && (
            <span
              className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${side === "blue" ? blueBadgeClass : redBadgeClass}`}
            >
              {side === "blue" ? "Blue" : "Red"}
            </span>
          )}
          <span className="text-sm font-bold">{sideLabel()}</span>
        </div>

        <div className="flex items-center justify-center">
          <StepTracker step={step} sequence={state.bestOf} done={done} />
        </div>

        <div className="flex justify-end items-center gap-3">
          <span className="text-sm tracking-wider font-bold">
            {blueName} vs {redName}
          </span>
        </div>
      </header>

      {/* Status bar */}
      <div className="py-3 px-6 bg-tools-carbon border-b border-white/7 flex items-center justify-center gap-3">
        {done ? (
          <>
            <span className="font-mono text-sm tracking-widest">
              Draft complete
            </span>
            <span className="font-mono text-sm tracking-widest py-0.75 px-2.5 rounded uppercase bg-tools-gold/10 text-tools-gold">
              Done
            </span>
          </>
        ) : currentSeqStep ? (
          <>
            <span
              className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${currentSeqStep.team === "blue" ? blueBadgeClass : redBadgeClass}`}
            >
              {currentSeqStep.team === "blue" ? "Blue" : "Red"}
            </span>
            <span className="font-mono text-sm tracking-widest">
              <strong>{currentTeam}</strong>
              {isMyTurn ? " — Your turn to" : " is choosing their"}
            </span>
            <span
              className={`font-mono text-xs tracking-widest py-0.75 px-2.5 rounded uppercase ${
                currentSeqStep.action === "ban"
                  ? "bg-tools-red/12 text-tools-red-light"
                  : "bg-tools-green/10 text-tools-green-light"
              }`}
            >
              {currentSeqStep.action.toUpperCase()}
            </span>
          </>
        ) : null}
      </div>

      {/* Main body */}
      <div className="h-full flex flex-row">
        {/* Blue sidebar */}
        <div className="p-5 border-r border-white/7 flex flex-col gap-3 w-1/6">
          <div
            className={`text-lg font-mono tracking-widest uppercase mb-1.5 font-bold text-center border rounded-lg ${blueBadgeClass}`}
          >
            {blueName}
          </div>
          {blueSeqSteps.map((s, i) => {
            const n =
              blueSeqSteps.slice(0, i).filter((p) => p.action === s.action)
                .length + 1;
            const filled = blueActions[i];
            const status = filled
              ? "filled"
              : s.globalIdx === step
                ? "active"
                : "pending";
            return (
              <ResultCard
                key={i}
                map={filled?.map}
                type={s.action}
                label={s.action === "ban" ? `Ban ${n}` : `Pick ${n}`}
                status={status}
              />
            );
          })}
        </div>

        {/* Center */}
        <div className="p-5 flex flex-col flex-1">
          {done ? (
            <>
              <DonePanel
                picks={actions.filter((a) => a.action === "pick")}
                blueName={blueName}
              />
              <button
                className="mt-1 py-3 px-3 bg-transparent border border-white/7 rounded-lg font-head text-[13px] font-semibold text-white transition-all duration-150 w-full hover:border-white/15 hover:text-white"
                onClick={handleReset}
              >
                New draft
              </button>
            </>
          ) : (
            <>
              <div className="text-lg font-mono tracking-widest uppercase text-center mb-4">
                Map pool
              </div>
              <div className="flex flex-col gap-2">
                {maps.map((map) => {
                  const status = mapStatuses[map];
                  const clickable = status === "available" && isMyTurn;

                  const isPick = status.startsWith("picked-");
                  const gameNum = isPick
                    ? status.replace("picked-g", "")
                    : null;

                  const cardClass = [
                    "border rounded-lg py-3.5 px-4 flex items-center justify-between w-full text-left transition-all duration-200 relative overflow-hidden",
                    "before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.75 before:bg-transparent before:transition-colors before:duration-200",
                    clickable
                      ? "cursor-pointer bg-tools-carbon border-tools-gold/30 animate-[pulseBorder_2s_infinite] hover:border-white/15 hover:bg-tools-graphite hover:translate-x-0.5 hover:before:bg-tools-gold"
                      : status === "banned"
                        ? "!cursor-default opacity-50 bg-tools-graphite border-tools-red/20 blur-[0.5px]"
                        : isPick
                          ? "!cursor-default bg-tools-green/4 border-tools-green/20"
                          : "!cursor-default bg-tools-carbon border-white/7",
                  ].join(" ");

                  const mapStatusClass = [
                    "text-sm font-mono tracking-widest uppercase py-0.75 px-2.25 rounded",
                    status === "available" && "hidden",
                    status === "banned" &&
                      "bg-tools-red/10 text-tools-red-light",
                    isPick && "bg-tools-green/10 text-tools-green-light",
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
                      <span
                        className={`font-semibold${status === "banned" ? " line-through text-tools-red-light" : ""}`}
                      >
                        {map}
                      </span>
                      <span className={mapStatusClass}>
                        {status === "banned"
                          ? "Banned"
                          : isPick
                            ? `Game ${gameNum}`
                            : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Red sidebar */}
        <div className="p-5 border-l border-white/7 flex flex-col gap-3 w-1/6">
          <div
            className={`text-lg font-mono tracking-widest uppercase mb-1.5 font-bold text-center border rounded-lg ${redBadgeClass}`}
          >
            {redName}
          </div>
          {redSeqSteps.map((s, i) => {
            const n =
              redSeqSteps.slice(0, i).filter((p) => p.action === s.action)
                .length + 1;
            const filled = redActions[i];
            const status = filled
              ? "filled"
              : s.globalIdx === step
                ? "active"
                : "pending";
            return (
              <ResultCard
                key={i}
                map={filled?.map}
                type={s.action}
                label={s.action === "ban" ? `Ban ${n}` : `Pick ${n}`}
                status={status}
              />
            );
          })}
        </div>
      </div>

      {pending && currentSeqStep && (
        <ConfirmModal
          map={pending}
          action={currentSeqStep.action}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}
