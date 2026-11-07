import { type ReplayEvent, type ReplayEventType, Team } from "@os-tools/shared";

import type { RoomState } from "../managers/roomManager.js";

type NewReplayEvent =
  | Omit<Extract<ReplayEvent, { type: ReplayEventType.Pending }>, "atMs">
  | Omit<Extract<ReplayEvent, { type: ReplayEventType.Action }>, "atMs">;

export function appendReplayEvent(state: RoomState, event: NewReplayEvent, now: number): ReplayEvent[] {
  if (state.replayStartedAt == null) {
    return state.replayEvents ?? [];
  }

  const elapsed = (now - state.replayStartedAt) * 1000;
  const floor = Math.floor(elapsed);
  // Python round() resolves exact halfway cases toward the even integer.
  const rounded = elapsed - floor === 0.5 ? floor + (floor % 2 === 0 ? 0 : 1) : Math.round(elapsed);

  return [...(state.replayEvents ?? []), { ...event, atMs: Math.max(0, rounded) }];
}

export function stateForClient<T extends RoomState>(state: T, side: string = Team.Spectator): T {
  const payload = { ...state };

  if (!state.done) {
    delete payload.replayEvents;
    payload.pendingBlue = side === Team.Blue ? state.pendingBlue : null;
    payload.pendingRed = side === Team.Red ? state.pendingRed : null;
  }

  return payload;
}
