import type { ReplayEvent } from "../models/common.js";
import type { RoomState } from "../models/room.js";

type NewReplayEvent =
  Omit<Extract<ReplayEvent, { type: "pending" }>, "atMs"> | Omit<Extract<ReplayEvent, { type: "action" }>, "atMs">;

export function appendReplayEvent(state: RoomState, event: NewReplayEvent, now: number): ReplayEvent[] {
  if (state.replayStartedAt == null) return state.replayEvents ?? [];

  const elapsed = (now - state.replayStartedAt) * 1000;
  const floor = Math.floor(elapsed);
  // Python round() resolves exact halfway cases toward the even integer.
  const rounded = elapsed - floor === 0.5 ? floor + (floor % 2 === 0 ? 0 : 1) : Math.round(elapsed);

  return [...(state.replayEvents ?? []), { ...event, atMs: Math.max(0, rounded) }];
}

export function stateForClient(state: RoomState, side = "spectator"): RoomState {
  const payload = { ...state };

  if (!state.done) {
    delete payload.replayEvents;
    payload.pendingBlue = side === "blue" ? state.pendingBlue : null;
    payload.pendingRed = side === "red" ? state.pendingRed : null;
  }

  return payload;
}
