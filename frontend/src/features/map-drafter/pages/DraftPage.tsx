import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEQUENCE_MAP } from "@map-drafter/constants.ts";
import {
  ALL_MAPS,
  TIMER_SECONDS,
  Team,
  DraftAction,
} from "@/features/common/constants";
import { deriveMapStatuses } from "@/features/map-drafter/utils";
import LoadingScreen from "@/features/common/components/LoadingScreen";
import ErrorScreen from "@/features/map-drafter/components/ErrorScreen";
import { useMapDraftContext } from "@/features/map-drafter/context/MapDraftContext";
import { StepTracker } from "@/features/common/components/StepTracker";
import ResultCard from "@/features/common/components/ResultCard";
import DonePanel from "@/features/map-drafter/components/DonePanel";
import { Sequence } from "@/features/map-drafter/types";
import { BackButton, HomeButton } from "@/features/common/components/NavButtons";

export default function DraftPage() {
  const { state, side, loading, handleAction, handlePending, handleReady } =
    useMapDraftContext();
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
    // Use server elapsed (clamped to ≥0) as the starting point, then count
    // down with local clock to avoid clock-skew causing a frozen/stuttering display.
    const serverElapsed = Math.max(
      0,
      Date.now() / 1000 - state!.stepStartedAt!,
    );
    const initialTimeLeft = Math.max(
      0,
      Math.ceil(TIMER_SECONDS - serverElapsed),
    );
    setTimeLeft(initialTimeLeft);
    const localStart = Date.now();
    function tick() {
      const localElapsed = (Date.now() - localStart) / 1000;
      setTimeLeft(Math.max(0, Math.ceil(initialTimeLeft - localElapsed)));
    }
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
    ? currentSeqStep.team === Team.Blue
      ? blueName
      : redName
    : null;
  const isMyTurn = currentSeqStep !== null && currentSeqStep.team === side;

  const serverPending =
    side === Team.Blue
      ? state.pendingBlue
      : side === Team.Red
        ? state.pendingRed
        : null;
  const pending = localPending ?? serverPending;

  const mapStatuses = deriveMapStatuses(
    state,
    sequence.filter((s) => s.action === DraftAction.Pick).length,
  );

  const blueActions = actions.filter((a) => a.team === blueName);
  const redActions = actions.filter((a) => a.team === redName);

  const blueSeqSteps = sequence
    .map((s, globalIdx) => ({ ...s, globalIdx }))
    .filter((s) => s.team === Team.Blue);
  const redSeqSteps = sequence
    .map((s, globalIdx) => ({ ...s, globalIdx }))
    .filter((s) => s.team === Team.Red);

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
    if (side === Team.Blue) return blueName;
    if (side === Team.Red) return redName;
    return "Spectating";
  }

  const blueBadgeClass = "bg-tools-blue-dim text-tools-blue";
  const redBadgeClass = "bg-tools-red-dim text-tools-red";

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="grid grid-cols-3 px-6 border-b border-white/7 bg-tools-void/70 h-16 items-center">
        <div className="flex items-center gap-3">
          <BackButton />
          <HomeButton />
          <div className="w-px h-4 bg-white/15" />
          {side !== Team.Spectator && (
            <span
              className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${side === Team.Blue ? blueBadgeClass : redBadgeClass}`}
            >
              {side === Team.Blue ? "Blue" : "Red"}
            </span>
          )}
          <span className="text-sm font-bold">{sideLabel()}</span>
        </div>

        <div className="flex items-center justify-center">
          <StepTracker
            step={step}
            sequence={SEQUENCE_MAP[state.bestOf]}
            done={done}
          />
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
                className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${currentSeqStep.team === Team.Blue ? blueBadgeClass : redBadgeClass}`}
              >
                {currentSeqStep.team === Team.Blue ? "Blue" : "Red"}
              </span>
              <span className="font-mono text-sm tracking-widest">
                <strong>{currentTeam}</strong>
                {isMyTurn ? " — Your turn to" : " is choosing their"}
              </span>
              <span
                className={`font-mono text-xs tracking-widest py-0.75 px-2.5 rounded uppercase ${
                  currentSeqStep.action === DraftAction.Ban
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
            const totalPicks = sequence.filter(
              (p) => p.action === DraftAction.Pick,
            ).length;
            const gameNum =
              totalPicks -
              sequence
                .slice(0, s.globalIdx)
                .filter((p) => p.action === DraftAction.Pick).length;
            const filled = blueActions[i];
            const status = filled
              ? "filled"
              : s.globalIdx === step
                ? "active"
                : "pending";
            return (
              <ResultCard
                key={i}
                value={filled?.map}
                type={s.action}
                label={
                  s.action === DraftAction.Ban ? `Ban ${n}` : `Pick ${gameNum}`
                }
                status={status}
              />
            );
          })}
        </div>

        {/* Center */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex-1 flex flex-col">
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
                    ) : side === Team.Blue ? (
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
                    <span className="font-mono text-sm font-bold">
                      {redName}
                    </span>
                    {state.readyRed ? (
                      <span className="font-mono text-xs tracking-widest uppercase text-tools-green-light bg-tools-green/10 px-3 py-1.5 rounded border border-tools-green/20">
                        Ready
                      </span>
                    ) : side === Team.Red ? (
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
              <DonePanel actions={actions} blueName={blueName} />
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
                    const isDecider = status === "decider";
                    const clickable = status === "available" && isMyTurn;
                    const isPick = status.startsWith("picked-");
                    const gameNum = isPick
                      ? status.replace("picked-g", "")
                      : null;
                    const image = ALL_MAPS.find((m) => m.name === map)?.image;
                    const pickAction = isPick
                      ? actions.find(
                          (a) => a.map === map && a.action === DraftAction.Pick,
                        )
                      : null;
                    const pickTeam = pickAction?.team ?? null;
                    const banTeam =
                      status === "banned"
                        ? (actions.find(
                            (a) =>
                              a.map === map && a.action === DraftAction.Ban,
                          )?.team ?? null)
                        : null;
                    const isBanning =
                      currentSeqStep?.action === DraftAction.Ban;

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
                            : isDecider
                              ? "!cursor-default border-tools-gold/50"
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
                        {isDecider && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-mono text-sm font-bold tracking-widest uppercase bg-tools-gold/20 text-tools-gold px-2.5 py-1 rounded">
                              Decider · G3
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
                      currentSeqStep.action === DraftAction.Ban
                        ? "bg-tools-red/10 border-tools-red/30 text-tools-red-light hover:bg-tools-red/20 hover:border-tools-red/50"
                        : "bg-tools-green/10 border-tools-green/30 text-tools-green-light hover:bg-tools-green/20 hover:border-tools-green/50"
                    }`}
                    disabled={!pending}
                    onClick={handleConfirm}
                  >
                    {currentSeqStep.action === DraftAction.Ban ? "Ban" : "Pick"}
                    {pending ? ` ${pending}` : ""}
                  </button>
                )}
              </div>
            )}
          </div>

          {side === Team.Spectator && (
            <div className="pt-4 border-t border-white/7 h-34 flex items-center justify-center">
              {!bothReady ? (
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${blueBadgeClass}`}
                    >
                      Blue
                    </span>
                    <span className="font-mono text-sm font-bold">
                      {blueName}
                    </span>
                    {state.readyBlue ? (
                      <span className="font-mono text-xs tracking-widest uppercase text-tools-green-light bg-tools-green/10 px-3 py-1 rounded border border-tools-green/20">
                        Ready
                      </span>
                    ) : (
                      <span className="font-mono text-xs tracking-widest uppercase text-white/25 px-3 py-1">
                        Not ready
                      </span>
                    )}
                  </div>
                  <div className="w-px bg-white/7 self-stretch" />
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${redBadgeClass}`}
                    >
                      Red
                    </span>
                    <span className="font-mono text-sm font-bold">
                      {redName}
                    </span>
                    {state.readyRed ? (
                      <span className="font-mono text-xs tracking-widest uppercase text-tools-green-light bg-tools-green/10 px-3 py-1 rounded border border-tools-green/20">
                        Ready
                      </span>
                    ) : (
                      <span className="font-mono text-xs tracking-widest uppercase text-white/25 px-3 py-1">
                        Not ready
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 justify-center">
                  {sequence.map((s, i) => {
                    const completedAction = actions[i];
                    const mapEntry = completedAction
                      ? ALL_MAPS.find((m) => m.name === completedAction.map)
                      : null;
                    const isBlue = s.team === Team.Blue;
                    const isBan = s.action === DraftAction.Ban;
                    const teamName = isBlue ? blueName : redName;
                    const isCurrent = !done && i === step;
                    const totalPicks = sequence.filter(
                      (p) => p.action === DraftAction.Pick,
                    ).length;
                    const pickNumber = !isBan
                      ? totalPicks -
                        sequence
                          .slice(0, i)
                          .filter((p) => p.action === DraftAction.Pick).length
                      : null;

                    return (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-1 w-20"
                      >
                        <span
                          className={`font-mono font-bold tracking-widest uppercase text-center truncate w-full ${isBlue ? "text-tools-blue" : "text-tools-red"}`}
                        >
                          {teamName}
                        </span>
                        <div
                          className={`relative w-20 h-20 rounded border-2 overflow-hidden ${isBlue ? "border-tools-blue" : "border-tools-red"} ${isCurrent ? "ring-1 ring-white/30" : ""} ${!completedAction && !isCurrent ? "opacity-30" : ""}`}
                        >
                          {mapEntry?.icon ? (
                            <img
                              src={mapEntry.icon}
                              alt={completedAction?.map}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/5" />
                          )}
                          {isBan && completedAction && (
                            <>
                              <div className="absolute inset-0 bg-black/50 grayscale" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="font-mono text-[9px] font-bold tracking-widest uppercase bg-tools-red/50 text-white px-1 py-0.5 rounded">
                                  Banned
                                </span>
                              </div>
                            </>
                          )}
                          {!isBan && completedAction && pickNumber && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="font-mono text-sm font-bold tracking-widest uppercase bg-tools-gold text-black px-2 py-0.5 rounded">
                                G{pickNumber}
                              </span>
                            </div>
                          )}
                          {isCurrent && !completedAction && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span
                                className={`font-mono font-bold tabular-nums text-2xl ${
                                  timeLeft <= 5
                                    ? "text-tools-red"
                                    : timeLeft <= 10
                                      ? "text-amber-400"
                                      : "text-white/70"
                                }`}
                              >
                                {timeLeft}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="font-mono text-[9px] text-white/40 text-center leading-tight w-20 truncate">
                          {completedAction?.map ??
                            (isBan ? "Ban" : `G${pickNumber}`)}
                        </span>
                      </div>
                    );
                  })}
                  {state.bestOf === Sequence.BO3 &&
                    (() => {
                      const deciderMap = Object.entries(mapStatuses).find(
                        ([, s]) => s === "decider",
                      )?.[0];
                      const deciderEntry = deciderMap
                        ? ALL_MAPS.find((m) => m.name === deciderMap)
                        : null;
                      return (
                        <div className="flex flex-col items-center gap-1 w-20">
                          <span className="font-mono font-bold tracking-widest uppercase text-center text-tools-gold">
                            Decider
                          </span>
                          <div
                            className={`relative w-20 h-20 rounded border-2 overflow-hidden border-tools-gold ${!deciderMap ? "opacity-30" : ""}`}
                          >
                            {deciderEntry?.icon ? (
                              <img
                                src={deciderEntry.icon}
                                alt={deciderMap}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-white/5" />
                            )}
                            {deciderMap && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="font-mono text-sm font-bold tracking-widest uppercase bg-tools-gold text-black px-2 py-0.5 rounded">
                                  G3
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="font-mono text-[9px] text-white/40 text-center leading-tight w-20">
                            {deciderMap ?? "G3"}
                          </span>
                        </div>
                      );
                    })()}
                </div>
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
            const totalPicks = sequence.filter(
              (p) => p.action === DraftAction.Pick,
            ).length;
            const gameNum =
              totalPicks -
              sequence
                .slice(0, s.globalIdx)
                .filter((p) => p.action === DraftAction.Pick).length;
            const filled = redActions[i];
            const status = filled
              ? "filled"
              : s.globalIdx === step
                ? "active"
                : "pending";
            return (
              <ResultCard
                key={i}
                value={filled?.map}
                type={s.action}
                label={
                  s.action === DraftAction.Ban ? `Ban ${n}` : `Pick ${gameNum}`
                }
                status={status}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
