import type { DraftType } from "../models/common.js";

export const roomKey = (type: DraftType, roomId: string) => `${type}:${roomId}`;

export function initialState(roomId: string, body: { blueName: string; redName: string }) {
  return {
    roomId,
    blueName: body.blueName.trim() || "Team A",
    redName: body.redName.trim() || "Team B",
    step: 0,
    actions: [],
    done: false,
    readyBlue: false,
    readyRed: false,
    pendingBlue: null,
    pendingRed: null,
    stepStartedAt: null,
    replayStartedAt: null,
    replayEvents: [],
  };
}
