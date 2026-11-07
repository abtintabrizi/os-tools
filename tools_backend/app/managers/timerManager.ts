import { type DraftType, TIMER_SECONDS } from "@os-tools/shared";

import { roomKey } from "../utils/roomUtil.js";
import { LoggerManager } from "./loggerManager.js";
import type { RoomStateByType } from "./roomManager.js";

const logger = new LoggerManager("managers.timerManager");

export interface RoomTimer {
  handle: NodeJS.Timeout;
  step: number;
  type: DraftType;
  roomId: string;
}

type TimeoutHandler = (type: DraftType, roomId: string, timer: RoomTimer) => Promise<void>;

export class TimerManager {
  private readonly timers = new Map<string, RoomTimer>();
  private stopped = false;

  public constructor(private readonly onTimeout: TimeoutHandler) {}

  public has = (type: DraftType, roomId: string): boolean => {
    return this.timers.has(roomKey(type, roomId));
  };

  public isCurrent = (type: DraftType, roomId: string, timer: RoomTimer): boolean => {
    return this.timers.get(roomKey(type, roomId)) === timer;
  };

  public remove = (type: DraftType, roomId: string, timer: RoomTimer): void => {
    if (this.isCurrent(type, roomId, timer)) {
      this.timers.delete(roomKey(type, roomId));
    }
  };

  public schedule = <T extends DraftType>(type: T, state: NoInfer<RoomStateByType[T]>): void => {
    const key = roomKey(type, state.roomId);
    this.cancel(type, state.roomId, "rescheduled");

    if (this.stopped || state.done || !state.readyBlue || !state.readyRed || state.stepStartedAt == null) {
      return;
    }

    const delay = Math.max(0, (state.stepStartedAt + TIMER_SECONDS - Date.now() / 1000) * 1000);
    const timer: RoomTimer = {
      step: state.step,
      type,
      roomId: state.roomId,
      handle: setTimeout(() => {
        void this.onTimeout(type, state.roomId, timer).catch((error: unknown) => {
          logger.error("Timer failed", { draftType: type, roomId: state.roomId, step: timer.step, error });
          this.remove(type, state.roomId, timer);
        });
      }, delay),
    };

    this.timers.set(key, timer);

    logger.info("Timer spawned", {
      draftType: type,
      roomId: state.roomId,
      step: state.step,
      delaySeconds: delay / 1000,
      stepStartedAt: state.stepStartedAt,
    });
  };

  private cancel = (type: DraftType, roomId: string, reason: string): void => {
    const key = roomKey(type, roomId);
    const timer = this.timers.get(key);

    if (!timer) {
      return;
    }

    clearTimeout(timer.handle);
    this.timers.delete(key);

    logger.info("Timer cancelled", { draftType: type, roomId, step: timer.step, reason });
  };

  public stop = (): void => {
    this.stopped = true;

    for (const timer of this.timers.values()) {
      this.cancel(timer.type, timer.roomId, "shutdown");
    }
  };
}
