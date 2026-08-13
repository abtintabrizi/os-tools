import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SEQUENCE_MAP } from "@map-drafter/constants.ts";
import {
  ALL_MAPS,
  TIMER_SECONDS,
  Team,
  DraftAction,
} from "@/features/common/constants/constants";
import { deriveMapStatuses } from "@/features/map-drafter/utils";
import LoadingScreen from "@/features/common/components/LoadingScreen";
import ErrorScreen from "@/features/map-drafter/components/ErrorScreen";
import { useMapDraftContext } from "@/features/map-drafter/context/MapDraftContext";
import { StepTracker } from "@/features/common/components/StepTracker";
import DonePanel from "@/features/map-drafter/components/DonePanel";
import { MapSidebarCard } from "@/features/map-drafter/components/MapSidebarCard";
import { AnimatedNumber } from "@/features/common/components/AnimatedNumber";
import { SpectatorBar } from "@/features/map-drafter/components/SpectatorBar";
import {
  BackButton,
  HomeButton,
} from "@/features/common/components/NavButtons";
import { useDraftReplay } from "@/features/common/hooks/useDraftReplay";
import { ReplayControls } from "@/features/common/components/ReplayControls";
import { ReplayTimeline } from "@/features/common/components/ReplayTimeline";

export default function DraftPage() {
  const {
    state: completedState,
    side,
    loading,
    handleAction,
    handlePending,
    handleReady,
  } = useMapDraftContext();
  const isReplay =
    new URLSearchParams(window.location.search).get("replay") === "1";
  const {
    state,
    playing,
    togglePlaying,
    restart,
    nextAction,
    previousAction,
    hasNextAction,
    hasPreviousAction,
    elapsedMs,
    durationMs,
  } = useDraftReplay(completedState, isReplay);
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_SECONDS);
  const [countdownLeft, setCountdownLeft] = useState(0);
  const clockOffsetRef = useRef(0);
  const stepStartedAtRef = useRef<number | null>(null);
  const navigate = useNavigate();

  // stepStartedAtRef updated in render body so stale intervals immediately read new value
  stepStartedAtRef.current = state?.stepStartedAt ?? null;

  useEffect(() => {
    if (state?.serverTime) {
      clockOffsetRef.current = state.serverTime - Date.now() / 1000;
    }
  }, [state?.serverTime]);

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

  const pending =
    isReplay && currentSeqStep
      ? currentSeqStep.team === Team.Blue
        ? state.pendingBlue
        : state.pendingRed
      : side === Team.Blue
        ? state.pendingBlue
        : side === Team.Red
          ? state.pendingRed
          : null;

  const mapStatuses = deriveMapStatuses(state, sequence);

  const blueSeqSteps = sequence
    .map((s, globalIdx) => ({ ...s, globalIdx }))
    .filter((s) => s.team === Team.Blue);
  const redSeqSteps = sequence
    .map((s, globalIdx) => ({ ...s, globalIdx }))
    .filter((s) => s.team === Team.Red);

  function handleMapClick(map: string) {
    if (!isMyTurn || mapStatuses[map] !== "available") return;
    handlePending(map);
  }

  async function handleConfirm() {
    if (!pending) return;
    await handleAction(pending);
  }

  function watchReplay() {
    const url = new URL(window.location.href);
    url.searchParams.set("side", Team.Spectator);
    url.searchParams.set("replay", "1");
    window.location.assign(url.toString());
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
          <StepTracker
            step={step}
            sequence={SEQUENCE_MAP[state.bestOf]}
            done={done}
          />
        </div>

        <div className="flex justify-end items-center gap-3">
          {done && !isReplay && state.replayEvents?.length ? (
            <button
              type="button"
              onClick={watchReplay}
              className="font-mono text-xs tracking-widest uppercase px-3 py-1.5 rounded border border-tools-gold/40 text-tools-gold bg-tools-gold/6 hover:bg-tools-gold/14 transition"
            >
              Watch Replay
            </button>
          ) : null}
          <span className="text-sm tracking-wider font-bold">
            {blueName} vs {redName}
          </span>
        </div>
      </header>

      {/* Status bar */}
      <div className="py-3 px-6 bg-tools-carbon border-b border-white/7 grid grid-cols-3 items-center h-13 shrink-0">
        <div />
        <div className="flex items-center justify-center gap-3">
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
        <div />
      </div>

      {/* Main body */}
      <div className="flex flex-row flex-1 overflow-hidden">
        {/* Blue sidebar */}
        <div className="p-4 border-r border-white/7 flex flex-col gap-2.5 w-1/6 shrink-0 overflow-y-auto">
          <div
            className={`text-lg font-mono tracking-widest uppercase mb-1.5 font-bold text-center border rounded-lg ${blueBadgeClass}`}
          >
            {blueName}
          </div>
          {blueSeqSteps.map((s, i) => (
            <MapSidebarCard
              key={s.globalIdx}
              step={s}
              cardIndex={i}
              isBlue
              timeLeft={timeLeft}
              state={state}
            />
          ))}
        </div>

        {/* Center */}
        <div className="px-5 pt-5 flex flex-col flex-1">
          <div className="flex-1 flex flex-col">
            {!bothReady ? (
              <div className="flex flex-col items-center justify-center h-full gap-8">
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
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <span className="font-mono text-lg tracking-widest uppercase text-white/40">
                  Draft starting in
                </span>
                <AnimatedNumber
                  value={countdownLeft}
                  className="font-mono font-bold tabular-nums text-8xl text-tools-gold"
                />
              </div>
            ) : done ? (
              <DonePanel />
            ) : (
              <div className="flex flex-col justify-center items-center">
                <AnimatedNumber
                  value={timeLeft}
                  className={`font-mono font-bold tabular-nums mb-4 text-6xl transition-colors ${
                    timeLeft <= 5
                      ? "text-tools-red"
                      : timeLeft <= 10
                        ? "text-amber-400"
                        : "text-white/30"
                  }`}
                />
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
            <>
              {isReplay && state.replayEvents?.length ? (
                <>
                  <ReplayTimeline
                    events={state.replayEvents}
                    actions={completedState?.actions ?? []}
                    elapsedMs={elapsedMs}
                    durationMs={durationMs}
                  />
                  <ReplayControls
                    playing={playing}
                    onTogglePlaying={togglePlaying}
                    onRestart={restart}
                    onPreviousAction={previousAction}
                    onNextAction={nextAction}
                    hasPreviousAction={hasPreviousAction}
                    hasNextAction={hasNextAction}
                  />
                </>
              ) : null}
              <SpectatorBar
                timeLeft={timeLeft}
                countdownLeft={countdownLeft}
                state={state}
              />
            </>
          )}
        </div>

        {/* Red sidebar */}
        <div className="p-4 border-l border-white/7 flex flex-col gap-2.5 w-1/6 shrink-0 overflow-y-auto">
          <div
            className={`text-lg font-mono tracking-widest uppercase mb-1.5 font-bold text-center border rounded-lg ${redBadgeClass}`}
          >
            {redName}
          </div>
          {redSeqSteps.map((s, i) => (
            <MapSidebarCard
              key={s.globalIdx}
              step={s}
              cardIndex={i}
              isBlue={false}
              timeLeft={timeLeft}
              state={state}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
