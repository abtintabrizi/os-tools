import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ALL_STRIKERS,
  ALL_MAPS,
  ALL_AWAKENINGS,
  TIMER_SECONDS,
  Team,
  DraftAction,
} from "@/features/common/constants/constants";
import LoadingScreen from "@/features/common/components/LoadingScreen";
import ErrorScreen from "@/features/map-drafter/components/ErrorScreen";
import { useStrikerDraftContext } from "@/features/striker-draft/context/StrikerDraftContext";
import { StepTracker } from "@/features/common/components/StepTracker";
import { STRIKER_SEQUENCE } from "@/features/striker-draft/constants";
import type { IndexedStep } from "@/features/striker-draft/types";
import { SidebarCard } from "@/features/striker-draft/components/SidebarCard";
import {
  BackButton,
  HomeButton,
} from "@/features/common/components/NavButtons";

export default function DraftPage() {
  const {
    state,
    side,
    loading,
    error,
    handleAction,
    handlePending,
    handleReady,
  } = useStrikerDraftContext();
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_SECONDS);
  const [countdownLeft, setCountdownLeft] = useState(0);
  const [localPending, setLocalPending] = useState<string | null>(null);
  const clockOffsetRef = useRef(0);
  const stepStartedAtRef = useRef<number | null>(null);
  const [showNoBanModal, setShowNoBanModal] = useState(false);
  const navigate = useNavigate();

  // stepStartedAtRef updated in render body so stale intervals immediately read new value
  stepStartedAtRef.current = state?.stepStartedAt ?? null;

  useEffect(() => {
    if (state?.serverTime) {
      clockOffsetRef.current = state.serverTime - Date.now() / 1000;
    }
  }, [state?.serverTime]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("room") || !params.get("side")) {
      navigate("/striker-draft", { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    ALL_STRIKERS.forEach((s) => {
      new Image().src = s.splash;
      new Image().src = s.icon;
    });
    ALL_MAPS.forEach((m) => {
      new Image().src = m.icon;
    });
    ALL_AWAKENINGS.forEach((a) => {
      new Image().src = a.icon;
    });
  }, []);

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
      const stepStartedAt = stepStartedAtRef.current;
      if (!stepStartedAt) {
        setTimeLeft(TIMER_SECONDS);
        return;
      }
      const now = Date.now() / 1000 + clockOffsetRef.current;
      if (now < stepStartedAt) {
        setTimeLeft(TIMER_SECONDS);
        return;
      }
      setTimeLeft(
        Math.max(0, Math.ceil(TIMER_SECONDS - (now - stepStartedAt))),
      );
    }
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [state?.stepStartedAt, state?.done, state?.readyBlue, state?.readyRed]);

  useEffect(() => {
    if (!state?.stepStartedAt || !state.readyBlue || !state.readyRed) return;
    function tick() {
      const stepStartedAt = stepStartedAtRef.current;
      if (!stepStartedAt) {
        setCountdownLeft(0);
        return;
      }
      const now = Date.now() / 1000 + clockOffsetRef.current;
      setCountdownLeft(Math.max(0, Math.ceil(stepStartedAt - now)));
    }
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [state?.stepStartedAt, state?.readyBlue, state?.readyRed]);

  useEffect(() => {
    if (countdownLeft > 0) {
      document.title = `Starting in ${countdownLeft}...`;
    } else {
      document.title = "OS Map Draft";
    }
    return () => {
      document.title = "OS Map Draft";
    };
  }, [countdownLeft]);

  useEffect(() => {
    setLocalPending(null);
  }, [state?.step]);

  if (loading) return <LoadingScreen message="Connecting to draft..." />;
  if (!state)
    return (
      <ErrorScreen message={error ?? "Room not found. Check your link."} />
    );

  const bothReady = state.readyBlue && state.readyRed;
  const { step, done, actions, blueName, redName, map, awakenings } = state;

  const currentSeqStep =
    !done && step < STRIKER_SEQUENCE.length ? STRIKER_SEQUENCE[step] : null;
  const currentTeam = currentSeqStep
    ? currentSeqStep.team === Team.Blue
      ? blueName
      : redName
    : null;
  const isMyTurn = currentSeqStep !== null && currentSeqStep.team === side;
  const isBanning = currentSeqStep?.action === DraftAction.Ban;

  const serverPending =
    side === Team.Blue
      ? state.pendingBlue
      : side === Team.Red
        ? state.pendingRed
        : null;
  const pending = localPending ?? serverPending;

  const bannedSet = new Set(
    actions.filter((a) => a.action === DraftAction.Ban).map((a) => a.striker),
  );
  const pickedSet = new Set(
    actions.filter((a) => a.action === DraftAction.Pick).map((a) => a.striker),
  );

  const blueSeqSteps: IndexedStep[] = STRIKER_SEQUENCE.map((s, i) => ({
    ...s,
    globalIdx: i,
  })).filter((s) => s.team === Team.Blue);
  const redSeqSteps: IndexedStep[] = STRIKER_SEQUENCE.map((s, i) => ({
    ...s,
    globalIdx: i,
  })).filter((s) => s.team === Team.Red);
  const blueActions = actions.filter((a) => a.team === blueName);
  const redActions = actions.filter((a) => a.team === redName);

  const mapEntry = ALL_MAPS.find((m) => m.name === map);

  function handleStrikerClick(name: string) {
    if (!isMyTurn || bannedSet.has(name) || pickedSet.has(name)) return;
    setLocalPending(name);
    handlePending(name);
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
      <header className="grid grid-cols-3 px-6 border-b border-white/7 bg-tools-void/70 h-16 items-center shrink-0">
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
          <StepTracker step={step} sequence={STRIKER_SEQUENCE} done={done} />
        </div>

        <div className="flex justify-end items-center gap-3">
          <span className="text-sm tracking-wider font-bold">
            {blueName} vs {redName}
          </span>
        </div>
      </header>

      {/* Status bar */}
      <div className="py-3 px-6 bg-tools-carbon border-b border-white/7 flex items-center justify-center h-13 shrink-0">
        <div className="flex items-center gap-3">
          {!bothReady ? (
            <span className="font-mono text-sm tracking-widest">
              Waiting for both teams to ready up
            </span>
          ) : countdownLeft > 0 && actions.length === 0 ? (
            <span className="font-mono text-sm tracking-widest">
              Starting in{" "}
              <strong className="text-tools-gold">{countdownLeft}</strong>
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
      </div>

      {/* Main body */}
      <div className="flex flex-row flex-1 overflow-hidden">
        {/* Blue sidebar */}
        <div className="p-4 border-r border-white/7 flex flex-col gap-2.5 w-1/6 shrink-0">
          <div
            className={`text-lg font-mono tracking-widest uppercase mb-1.5 font-bold text-center border rounded-lg ${blueBadgeClass}`}
          >
            {blueName}
          </div>
          {blueSeqSteps.map((s, i) => (
            <SidebarCard
              key={s.globalIdx}
              step={s}
              cardIndex={i}
              teamActions={blueActions}
              teamSteps={blueSeqSteps}
              isBlue
              currentStep={step}
              done={done}
              timeLeft={timeLeft}
              bothReady={bothReady}
              pendingStriker={state.pendingBlue}
            />
          ))}
        </div>

        {/* Center */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 p-5 flex flex-col min-h-0">
            {!bothReady ? (
              /* Ready up */
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="flex items-end gap-6">
                  {mapEntry && (
                    <div className="flex flex-col items-center gap-1.5">
                      <img
                        src={mapEntry.icon}
                        alt={map}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <span className="font-mono text-xs font-semibold text-white/60">
                        {map}
                      </span>
                    </div>
                  )}
                  {mapEntry && awakenings.length > 0 && (
                    <div className="w-px self-stretch bg-white/10" />
                  )}
                  {awakenings.map((aw) => {
                    const awEntry = ALL_AWAKENINGS.find((a) => a.name === aw);
                    return awEntry ? (
                      <div
                        key={aw}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <img
                          src={awEntry.icon}
                          alt={aw}
                          className="w-16 h-16 object-contain"
                        />
                        <span className="font-mono text-xs text-white/60">
                          {aw}
                        </span>
                      </div>
                    ) : null;
                  })}
                </div>
                <div className="flex gap-6">
                  <div className="flex flex-col items-center gap-3 w-26">
                    <span
                      className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${blueBadgeClass}`}
                    >
                      Blue
                    </span>
                    <span className="font-mono text-sm font-bold max-w-full truncate">
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
                  <div className="flex flex-col items-center gap-3 w-26">
                    <span
                      className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${redBadgeClass}`}
                    >
                      Red
                    </span>
                    <span className="font-mono text-sm font-bold max-w-full truncate">
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
            ) : countdownLeft > 0 && actions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="flex items-end gap-6">
                  {mapEntry && (
                    <div className="flex flex-col items-center gap-1.5">
                      <img
                        src={mapEntry.icon}
                        alt={map}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <span className="font-mono text-xs font-semibold text-white/60">
                        {map}
                      </span>
                    </div>
                  )}
                  {mapEntry && awakenings.length > 0 && (
                    <div className="w-px self-stretch bg-white/10" />
                  )}
                  {awakenings.map((aw) => {
                    const awEntry = ALL_AWAKENINGS.find((a) => a.name === aw);
                    return awEntry ? (
                      <div
                        key={aw}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <img
                          src={awEntry.icon}
                          alt={aw}
                          className="w-16 h-16 object-contain"
                        />
                        <span className="font-mono text-xs text-white/60">
                          {aw}
                        </span>
                      </div>
                    ) : null;
                  })}
                </div>
                <span className="font-mono text-xs tracking-widest uppercase text-white/40">
                  Draft starting in
                </span>
                <span className="font-mono font-bold tabular-nums text-8xl text-tools-gold">
                  {countdownLeft}
                </span>
              </div>
            ) : (
              /* Drafting / Done */
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-end gap-6">
                  {mapEntry && (
                    <div className="flex flex-col items-center gap-1.5">
                      <img
                        src={mapEntry.icon}
                        alt={map}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <span className="font-mono text-xs font-semibold text-white/60">
                        {map}
                      </span>
                    </div>
                  )}
                  {mapEntry && awakenings.length > 0 && (
                    <div className="w-px self-stretch bg-white/10" />
                  )}
                  {awakenings.map((aw) => {
                    const awEntry = ALL_AWAKENINGS.find((a) => a.name === aw);
                    return awEntry ? (
                      <div
                        key={aw}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <img
                          src={awEntry.icon}
                          alt={aw}
                          className="w-16 h-16 object-contain"
                        />
                        <span className="font-mono text-xs text-white/60">
                          {aw}
                        </span>
                      </div>
                    ) : null;
                  })}
                </div>
                <div className="grid grid-cols-6 gap-2 w-full max-w-xl">
                  {ALL_STRIKERS.map((striker) => {
                    const isBanned = bannedSet.has(striker.name);
                    const isPicked = pickedSet.has(striker.name);
                    const isAvailable = !isBanned && !isPicked;
                    const isSelected = pending === striker.name;
                    const clickable = isAvailable && isMyTurn;
                    const pickAction = isPicked
                      ? actions.find(
                          (a) =>
                            a.striker === striker.name &&
                            a.action === DraftAction.Pick,
                        )
                      : null;

                    const cardClass = [
                      "relative rounded-lg overflow-hidden border-2 transition-all duration-200 aspect-square",
                      clickable
                        ? isSelected
                          ? isBanning
                            ? "cursor-pointer border-tools-red scale-[1.05]"
                            : "cursor-pointer border-tools-green scale-[1.05]"
                          : isBanning
                            ? "cursor-pointer border-tools-red/30 hover:border-tools-red/60 hover:scale-[1.03] animate-[pulseBorderRed_2s_infinite]"
                            : "cursor-pointer border-tools-green/30 hover:border-tools-green/60 hover:scale-[1.03] animate-[pulseBorderGreen_2s_infinite]"
                        : isBanned
                          ? "!cursor-default opacity-25 border-tools-red/10 grayscale"
                          : isPicked
                            ? pickAction?.team === blueName
                              ? "!cursor-default border-tools-blue/70"
                              : "!cursor-default border-tools-red/70"
                            : side === Team.Spectator
                              ? "!cursor-default border-white/7"
                              : "!cursor-default border-white/7 opacity-60",
                    ].join(" ");

                    return (
                      <button
                        key={striker.name}
                        className={cardClass}
                        onClick={() => handleStrikerClick(striker.name)}
                        disabled={!clickable}
                      >
                        <img
                          src={striker.icon}
                          alt={striker.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
                        {isPicked && pickAction && (
                          <div className="absolute top-1 right-1">
                            <span
                              className={`font-mono text-xs font-bold tracking-widest uppercase px-1.5 py-0.5 rounded ${
                                pickAction.team === blueName
                                  ? "bg-tools-blue/70 text-white"
                                  : "bg-tools-red/70 text-white"
                              }`}
                            >
                              {pickAction.team === blueName
                                ? blueName
                                : redName}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 px-1 pb-1">
                          <span
                            className={`text-xs font-semibold leading-tight block text-center ${isBanned ? "line-through text-white/40" : "text-white"}`}
                          >
                            {striker.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {isMyTurn && currentSeqStep && (
                  <div className="flex gap-3">
                    {isBanning && (
                      <button
                        className="py-3 px-6 border rounded-lg font-head font-semibold transition-all duration-150 bg-transparent border-white/15 text-white/40 hover:border-white/30 hover:text-white/60"
                        onClick={() => setShowNoBanModal(true)}
                      >
                        No Ban
                      </button>
                    )}
                    <button
                      className={`py-3 px-6 border rounded-lg font-head font-semibold transition-all duration-150 min-w-52 disabled:opacity-50 disabled:cursor-default! ${
                        isBanning
                          ? "bg-tools-red/10 border-tools-red/30 text-tools-red-light hover:bg-tools-red/20 hover:border-tools-red/50"
                          : "bg-tools-green/10 border-tools-green/30 text-tools-green-light hover:bg-tools-green/20 hover:border-tools-green/50"
                      }`}
                      disabled={!pending}
                      onClick={handleConfirm}
                    >
                      {isBanning ? "Ban" : "Pick"}
                      {pending ? ` ${pending}` : ""}
                    </button>
                  </div>
                )}

                {showNoBanModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-tools-carbon border border-white/10 rounded-xl p-6 flex flex-col gap-4 w-80">
                      <p className="font-mono text-sm text-white/80 text-center leading-relaxed">
                        Are you sure you want to pass your ban?
                      </p>
                      <div className="flex gap-3">
                        <button
                          className="flex-1 py-2 border border-white/10 rounded-lg font-mono text-xs tracking-widest uppercase text-white/40 hover:border-white/20 hover:text-white/60 transition"
                          onClick={() => setShowNoBanModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="flex-1 py-2 border border-tools-red/30 rounded-lg font-mono text-xs tracking-widest uppercase text-tools-red-light bg-tools-red/10 hover:bg-tools-red/20 hover:border-tools-red/50 transition"
                          onClick={async () => {
                            setShowNoBanModal(false);
                            await handleAction(null);
                          }}
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Spectator sequence tracker */}
          {side === Team.Spectator && (
            <div className="px-5 mx-5 border-t border-white/7 h-40 flex items-center gap-5 shrink-0 justify-center">
              {/* Map + awakenings */}
              <div className="flex items-center gap-4 shrink-0">
                {mapEntry && (
                  <div className="w-20 flex flex-col items-center gap-1">
                    <img
                      src={mapEntry.icon}
                      alt={map}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <span className="font-mono text-[10px] font-semibold text-white/60 text-center w-full line-clamp-2 leading-tight">
                      {map}
                    </span>
                  </div>
                )}
                {mapEntry && awakenings.length > 0 && (
                  <div className="w-px h-12 bg-white/10" />
                )}
                {awakenings.map((aw) => {
                  const awEntry = ALL_AWAKENINGS.find((a) => a.name === aw);
                  return awEntry ? (
                    <div
                      key={aw}
                      className="w-20 flex flex-col items-center gap-1"
                    >
                      <img
                        src={awEntry.icon}
                        alt={aw}
                        className="w-16 h-16 object-contain"
                      />
                      <span className="font-mono text-[10px] text-white/50 text-center w-full line-clamp-2 leading-tight">
                        {aw}
                      </span>
                    </div>
                  ) : null;
                })}
              </div>
              <div className="w-px bg-white/7 h-3/5" />
              {!bothReady ? (
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2 w-26">
                    <span
                      className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${blueBadgeClass}`}
                    >
                      Blue
                    </span>
                    <span className="font-mono text-sm font-bold max-w-full truncate">
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
                  <div className="flex flex-col items-center gap-2 w-26">
                    <span
                      className={`font-mono text-xs font-bold tracking-widest uppercase py-1 px-2.5 rounded ${redBadgeClass}`}
                    >
                      Red
                    </span>
                    <span className="font-mono text-sm font-bold max-w-full truncate">
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
              ) : countdownLeft > 0 && actions.length === 0 ? (
                <span className="font-mono text-sm tracking-widest text-white/50">
                  Starting in{" "}
                  <strong className="text-tools-gold">{countdownLeft}</strong>
                </span>
              ) : (
                <div className="flex gap-2">
                  {STRIKER_SEQUENCE.map((s, i) => {
                    const completedAction = actions[i];
                    const strikerEntry = completedAction
                      ? ALL_STRIKERS.find(
                          (str) => str.name === completedAction.striker,
                        )
                      : null;
                    const isBlue = s.team === Team.Blue;
                    const isBan = s.action === DraftAction.Ban;
                    const isCurrent = !done && i === step;

                    return (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-1 w-20"
                      >
                        <span
                          className={`font-mono font-bold tracking-widest uppercase text-center truncate w-full ${isBlue ? "text-tools-blue" : "text-tools-red"}`}
                        >
                          {isBlue ? blueName : redName}
                        </span>
                        <div
                          className={`relative w-20 h-20 rounded border-2 overflow-hidden ${isBlue ? "border-tools-blue" : "border-tools-red"} ${isCurrent ? "ring-1 ring-white/30" : ""} ${!completedAction && !isCurrent ? "opacity-30" : ""}`}
                        >
                          {strikerEntry ? (
                            <img
                              src={strikerEntry.icon}
                              alt={completedAction?.striker}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/5" />
                          )}
                          {isBan &&
                            completedAction &&
                            completedAction.striker && (
                              <>
                                <div className="absolute inset-0 bg-black/50 grayscale" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="font-mono text-[9px] font-bold tracking-widest uppercase bg-tools-red/50 text-white px-1 py-0.5 rounded">
                                    Banned
                                  </span>
                                </div>
                              </>
                            )}
                          {isBan &&
                            completedAction &&
                            !completedAction.striker && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="font-mono text-[9px] font-bold tracking-widest uppercase bg-white/10 text-white/50 px-1 py-0.5 rounded">
                                  No Ban
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
                        <span className="font-mono text-xs text-white/40 text-center leading-tight w-20 line-clamp-2">
                          {completedAction
                            ? (completedAction.striker ?? "No Ban")
                            : isBan
                              ? "Ban"
                              : "Pick"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Red sidebar */}
        <div className="p-4 border-l border-white/7 flex flex-col gap-2.5 w-1/6 shrink-0">
          <div
            className={`text-lg font-mono tracking-widest uppercase mb-1.5 font-bold text-center border rounded-lg ${redBadgeClass}`}
          >
            {redName}
          </div>
          {redSeqSteps.map((s, i) => (
            <SidebarCard
              key={s.globalIdx}
              step={s}
              cardIndex={i}
              teamActions={redActions}
              teamSteps={redSeqSteps}
              isBlue={false}
              currentStep={step}
              done={done}
              timeLeft={timeLeft}
              bothReady={bothReady}
              pendingStriker={state.pendingRed}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
