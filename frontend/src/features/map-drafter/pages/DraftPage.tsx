import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEQUENCE_MAP } from "@map-drafter/constants.ts";
import { ALL_MAPS, TIMER_SECONDS } from "@/common/constants";
import { deriveMapStatuses } from "@/utils";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/features/map-drafter/components/ErrorScreen";
import { useDraftContext } from "@/features/map-drafter/context/DraftContext";
import { StepTracker } from "@/features/map-drafter/components/StepTracker";
import ResultCard from "@/features/map-drafter/components/ResultCard";
import DonePanel from "@/features/map-drafter/components/DonePanel";

export default function DraftPage() {
  const {
    state,
    side,
    loading,
    handleAction,
    handlePending,
    handleReady,
    handleReset,
  } = useDraftContext();
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_SECONDS);
  const [localPending, setLocalPending] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("room") || !params.get("side")) {
      navigate("/map-draft", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      !state?.stepStartedAt ||
      state.done ||
      !state.readyBlue ||
      !state.readyRed
    ) {
      setTimeLeft(TIMER_SECONDS);
      return;
    }
    function tick() {
      const elapsed = Date.now() / 1000 - state!.stepStartedAt!;
      setTimeLeft(Math.max(0, Math.ceil(TIMER_SECONDS - elapsed)));
    }
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [state?.stepStartedAt, state?.done, state?.readyBlue, state?.readyRed]);

  useEffect(() => {
    setLocalPending(null);
  }, [state?.step]);

  if (loading) return <LoadingScreen message="Connecting to draft..." />;
  if (!state) return <ErrorScreen message="Room not found. Check your link." />;

  const bothReady = state.readyBlue && state.readyRed;
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

  const serverPending =
    side === "blue"
      ? state.pendingBlue
      : side === "red"
        ? state.pendingRed
        : null;
  const pending = localPending ?? serverPending;

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
    setLocalPending(map);
    handlePending(map);
  }

  async function handleConfirm() {
    if (!pending) return;
    await handleAction(pending);
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
      <div className="py-3 px-6 bg-tools-carbon border-b border-white/7 grid grid-cols-3 items-center">
        <div />
        <div className="flex items-center justify-center gap-3">
          {!bothReady ? (
            <span className="font-mono text-sm tracking-widest">
              Waiting for both teams to ready up
            </span>
          ) : done ? (
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
        <div />
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
          {!bothReady ? (
            <div className="flex flex-col items-center justify-center h-full gap-8">
              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-3">
                  <span
                    className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${blueBadgeClass}`}
                  >
                    Blue
                  </span>
                  <span className="font-mono text-sm font-bold">
                    {blueName}
                  </span>
                  {state.readyBlue ? (
                    <span className="font-mono text-xs tracking-widest uppercase text-tools-green-light bg-tools-green/10 px-3 py-1.5 rounded border border-tools-green/20">
                      Ready
                    </span>
                  ) : side === "blue" ? (
                    <button
                      onClick={handleReady}
                      className="font-mono text-xs tracking-widest uppercase px-4 py-1.5 rounded border border-tools-blue/40 text-tools-blue hover:border-tools-blue/70 hover:bg-tools-blue/10 transition"
                    >
                      Ready up
                    </button>
                  ) : (
                    <span className="font-mono text-xs tracking-widest uppercase text-white/25 px-3 py-1.5">
                      Not ready
                    </span>
                  )}
                </div>

                <div className="w-px bg-white/7 self-stretch" />

                <div className="flex flex-col items-center gap-3">
                  <span
                    className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${redBadgeClass}`}
                  >
                    Red
                  </span>
                  <span className="font-mono text-sm font-bold">{redName}</span>
                  {state.readyRed ? (
                    <span className="font-mono text-xs tracking-widest uppercase text-tools-green-light bg-tools-green/10 px-3 py-1.5 rounded border border-tools-green/20">
                      Ready
                    </span>
                  ) : side === "red" ? (
                    <button
                      onClick={handleReady}
                      className="font-mono text-xs tracking-widest uppercase px-4 py-1.5 rounded border border-tools-red/40 text-tools-red hover:border-tools-red/70 hover:bg-tools-red/10 transition"
                    >
                      Ready up
                    </button>
                  ) : (
                    <span className="font-mono text-xs tracking-widest uppercase text-white/25 px-3 py-1.5">
                      Not ready
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : done ? (
            <div className="flex flex-col h-full">
              <DonePanel
                picks={actions.filter((a) => a.action === "pick")}
                blueName={blueName}
              />
              <div className="flex-1" />
              <button
                className="py-3 px-3 bg-transparent border border-white/7 rounded-lg font-head text-[13px] font-semibold text-white transition-all duration-150 w-full hover:border-white/15 hover:text-white"
                onClick={handleReset}
              >
                New draft
              </button>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center">
              <div
                className={`font-mono font-bold tabular-nums mb-4 text-6xl transition-colors ${
                  timeLeft <= 5
                    ? "text-tools-red"
                    : timeLeft <= 10
                      ? "text-amber-400"
                      : "text-white/30"
                }`}
              >
                {timeLeft}
              </div>
              <div className="grid grid-cols-4 gap-3 mb-3">
                {maps.map((map) => {
                  const status = mapStatuses[map];
                  const clickable = status === "available" && isMyTurn;
                  const isPick = status.startsWith("picked-");
                  const gameNum = isPick
                    ? status.replace("picked-g", "")
                    : null;
                  const image = ALL_MAPS.find((m) => m.name === map)?.image;
                  const pickAction = isPick
                    ? actions.find((a) => a.map === map && a.action === "pick")
                    : null;
                  const pickTeam = pickAction?.team ?? null;
                  const banTeam =
                    status === "banned"
                      ? (actions.find(
                          (a) => a.map === map && a.action === "ban",
                        )?.team ?? null)
                      : null;
                  const isBanning = currentSeqStep?.action === "ban";

                  const isSelected = pending === map;

                  const cardClass = [
                    "relative rounded-lg overflow-hidden border-2 transition-all duration-200 aspect-video",
                    clickable
                      ? isSelected
                        ? isBanning
                          ? "cursor-pointer border-tools-red scale-[1.03]"
                          : "cursor-pointer border-tools-green scale-[1.03]"
                        : isBanning
                          ? "cursor-pointer border-tools-red/40 animate-[pulseBorderRed_2s_infinite] hover:border-tools-red/70 hover:scale-[1.03]"
                          : "cursor-pointer border-tools-green/40 animate-[pulseBorderGreen_2s_infinite] hover:border-tools-green/70 hover:scale-[1.03]"
                      : status === "banned"
                        ? "!cursor-default opacity-40 border-tools-red/20 grayscale"
                        : isPick
                          ? "!cursor-default border-tools-green/30"
                          : "!cursor-default border-white/7",
                  ].join(" ");

                  return (
                    <button
                      key={map}
                      className={cardClass}
                      onClick={() => handleMapClick(map)}
                      disabled={!clickable}
                    >
                      {image && (
                        <img
                          src={image}
                          alt={map}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
                      {isPick && pickTeam && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-mono text-sm font-bold tracking-widest uppercase bg-tools-green/20 text-tools-green-light px-2.5 py-1 rounded">
                            {pickTeam} · G{gameNum}
                          </span>
                        </div>
                      )}
                      {status === "banned" && banTeam && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-mono text-sm font-bold tracking-widest uppercase bg-tools-red/20 text-tools-red-light px-2.5 py-1 rounded">
                            {banTeam} · Banned
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <span className="font-semibold leading-tight line-through text-tools-red-light">
                          {status === "banned" ? map : ""}
                        </span>
                        {status !== "banned" && (
                          <span className="font-semibold leading-tight">
                            {map}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {isMyTurn && currentSeqStep && (
                <button
                  className={`py-3 px-3 border rounded-lg font-head font-semibold transition-all duration-150 w-1/3 disabled:opacity-30 disabled:cursor-default! ${
                    currentSeqStep.action === "ban"
                      ? "bg-tools-red/10 border-tools-red/30 text-tools-red-light hover:bg-tools-red/20 hover:border-tools-red/50"
                      : "bg-tools-green/10 border-tools-green/30 text-tools-green-light hover:bg-tools-green/20 hover:border-tools-green/50"
                  }`}
                  disabled={!pending}
                  onClick={handleConfirm}
                >
                  {currentSeqStep.action === "ban" ? "Ban" : "Pick"}
                  {pending ? ` ${pending}` : ""}
                </button>
              )}
            </div>
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
    </div>
  );
}
