import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Team } from "@/features/common/constants/constants";
import type { ReplayEvent } from "@/features/common/types";

type ReplayState<Action> = {
  actions: Action[];
  step: number;
  done: boolean;
  readyBlue: boolean;
  readyRed: boolean;
  pendingBlue: string | null;
  pendingRed: string | null;
  stepStartedAt: number | null;
  serverTime?: number;
  replayEvents?: ReplayEvent[];
};

export function useDraftReplay<Action extends { step: number | null }, T extends ReplayState<Action>>(
  completedState: T | null,
  enabled: boolean,
) {
  const [state, setState] = useState<T | null>(completedState);
  const [playing, setPlaying] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedRef = useRef(0);
  const previousTickRef = useRef(Date.now());
  const previousGraceUntilRef = useRef(0);
  const previousSeekAnchorRef = useRef(0);
  const events = useMemo(() => completedState?.replayEvents ?? [], [completedState]);
  const eventTimes = useMemo(
    () => [...new Set(events.map((event) => event.atMs))],
    [events],
  );
  const durationMs = eventTimes[eventTimes.length - 1] ?? 0;

  useEffect(() => {
    elapsedRef.current = elapsedMs;
  }, [elapsedMs]);

  useEffect(() => {
    if (!enabled) {
      setState(completedState);
      return;
    }
    setPlaying(false);
    setElapsedMs(0);
    elapsedRef.current = 0;
    previousTickRef.current = Date.now();
    previousGraceUntilRef.current = 0;
    previousSeekAnchorRef.current = 0;
  }, [completedState, enabled]);

  useEffect(() => {
    if (!completedState || !enabled || events.length === 0) return;
    const lastActionEvent = events.filter((event) => event.type === "action").slice(-1)[0];

    const renderFrame = () => {
      const now = Date.now();
      if (playing) {
        const advanced = Math.min(durationMs, elapsedRef.current + now - previousTickRef.current);
        elapsedRef.current = advanced;
        setElapsedMs(advanced);
        if (advanced >= durationMs) setPlaying(false);
      }
      previousTickRef.current = now;
      const elapsed = elapsedRef.current;
      const due = events.filter((event) => event.atMs <= elapsed);
      const next = {
        ...completedState,
        actions: [],
        step: 0,
        done: false,
        readyBlue: true,
        readyRed: true,
        pendingBlue: null,
        pendingRed: null,
        stepStartedAt: now / 1000 + (5000 - elapsed) / 1000,
        serverTime: now / 1000,
      } as T;

      for (const event of due) {
        if (event.type === "pending") {
          if (event.side === Team.Blue) next.pendingBlue = event.value;
          if (event.side === Team.Red) next.pendingRed = event.value;
          continue;
        }
        const isLastAction = event === lastActionEvent;
        next.step = event.step + 1;
        next.actions = isLastAction
          ? completedState.actions
          : completedState.actions.filter((action) => action.step !== null && action.step <= event.step);
        next.pendingBlue = null;
        next.pendingRed = null;
        next.done = isLastAction;
        next.stepStartedAt = isLastAction
          ? null
          : now / 1000 - (elapsed - event.atMs) / 1000;
      }
      setState(next);
    };

    renderFrame();
    const timer = window.setInterval(renderFrame, 100);
    return () => window.clearInterval(timer);
  }, [completedState, durationMs, enabled, events, playing]);

  const togglePlaying = useCallback(() => {
    if (elapsedRef.current >= durationMs) {
      elapsedRef.current = 0;
      setElapsedMs(0);
    }
    previousTickRef.current = Date.now();
    previousGraceUntilRef.current = 0;
    setPlaying((value) => !value);
  }, [durationMs]);

  const restart = useCallback(() => {
    elapsedRef.current = 0;
    setElapsedMs(0);
    setPlaying(false);
    previousGraceUntilRef.current = 0;
  }, []);

  const nextAction = useCallback(() => {
    const target = eventTimes.find((time) => time > elapsedRef.current + 1);
    if (target !== undefined) {
      elapsedRef.current = target;
      setElapsedMs(target);
      previousTickRef.current = Date.now();
      previousGraceUntilRef.current = 0;
    }
  }, [eventTimes]);

  const previousAction = useCallback(() => {
    const now = Date.now();
    const seekFrom = now < previousGraceUntilRef.current
      ? previousSeekAnchorRef.current
      : elapsedRef.current;
    const target = eventTimes.filter((time) => time < seekFrom - 1).slice(-1)[0] ?? 0;
    elapsedRef.current = target;
    setElapsedMs(target);
    previousTickRef.current = now;
    previousSeekAnchorRef.current = target;
    previousGraceUntilRef.current = now + 1500;
  }, [eventTimes]);

  const hasNextAction = eventTimes.some((time) => time > elapsedMs + 1);
  const hasPreviousAction = eventTimes.some((time) => time < elapsedMs - 1);

  return {
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
  };
}
