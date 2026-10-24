import { randomInt } from "node:crypto";

import { COUNTDOWN_SECONDS } from "../constants/common.js";
import { SEQUENCE_MAPPING } from "../constants/mapDraft.js";
import { STRIKER_POOL, STRIKER_SEQUENCE } from "../constants/strikerDraft.js";
import type { DraftType, PlayingSide, Team } from "../models/common.js";
import type { RoomState, RoomStore } from "../models/room.js";
import { RequestError } from "../utils/requestError.js";
import { RoomLockManager } from "./roomLockManager.js";
import { roomKey } from "../utils/roomHelper.js";
import { applyMapAction } from "../utils/mapDraft.js";
import { appendReplayEvent, stateForClient } from "../utils/replay.js";
import { applyStrikerAction } from "../utils/strikerDraft.js";
import type { ConnectionManager } from "./connectionManager.js";
import type { TimerManager, RoomTimer } from "./timerManager.js";
import { Logger } from "./logger.js";

const logger = new Logger("managers.roomManager");

export class RoomManager {
  private readonly locks = new RoomLockManager();
  private stopped = false;

  public constructor(
    private readonly repository: RoomStore,
    private readonly timerManager: TimerManager,
    private readonly connections: ConnectionManager,
  ) {}

  public create = async (type: DraftType, build: (roomId: string) => RoomState): Promise<RoomState> => {
    // Serialize ID allocation within this process rather than overwriting an existing room.
    return this.locks.run(`${type}:create`, async () => {
      let id = this.generateRoomId();

      while (await this.repository.get(type, id)) id = this.generateRoomId();

      const state = build(id);

      await this.repository.save(type, state);

      logger.info("Room created", {
        draftType: type,
        roomId: id,
        blueName: state.blueName,
        redName: state.redName,
        ...("maps" in state
          ? { bestOf: state.bestOf, maps: state.maps }
          : { map: state.map, awakenings: state.awakenings }),
      });

      return stateForClient(state);
    });
  };

  private nowSeconds = (): number => Date.now() / 1000;

  private timing = (state: RoomState, now = this.nowSeconds()) => ({
    stepStartedAt: state.stepStartedAt ?? null,
    elapsedSeconds: state.stepStartedAt == null ? null : Math.round((now - state.stepStartedAt) * 1000) / 1000,
  });

  private generateRoomId = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    return Array.from({ length: 6 }, () => chars[randomInt(chars.length)]).join("");
  };

  private choose = <T>(pool: readonly T[]): T => {
    if (!pool.length) throw new Error("Cannot choose from an empty pool");

    return pool[randomInt(pool.length)]!;
  };

  private requireRoom = async (type: DraftType, roomId: string): Promise<RoomState> => {
    const state = await this.repository.get(type, roomId);

    if (!state) throw new RequestError(404, "Room not found");

    return state;
  };

  public get = async (type: DraftType, roomId: string): Promise<RoomState> => {
    return stateForClient(await this.requireRoom(type, roomId));
  };

  private playingSide = (side: Team): PlayingSide => {
    if (side !== "blue" && side !== "red") throw new RequestError(400, "Invalid side");

    return side;
  };

  public ready = async (type: DraftType, roomId: string, side: Team): Promise<RoomState> => {
    return this.locks.run(roomKey(type, roomId), async () => {
      const state = await this.requireRoom(type, roomId);

      this.playingSide(side);
      const bothReady = state.readyBlue && state.readyRed;

      if (side === "blue") state.readyBlue = true;
      else state.readyRed = true;

      if (!bothReady && state.readyBlue && state.readyRed) {
        const now = this.nowSeconds();

        state.replayStartedAt = now;
        state.replayEvents = [];
        state.stepStartedAt = now + COUNTDOWN_SECONDS;
      }

      await this.repository.save(type, state);
      logger.info("Ready", { draftType: type, roomId, side, readyBlue: state.readyBlue, readyRed: state.readyRed });

      if (!bothReady && state.readyBlue && state.readyRed) this.timerManager.schedule(type, state);

      this.connections.broadcast(type, state);

      return stateForClient(state, side);
    });
  };

  public pending = async (type: DraftType, roomId: string, side: Team, value: string | null): Promise<RoomState> => {
    const player = this.playingSide(side);

    return this.locks.run(roomKey(type, roomId), async () => {
      const state = await this.requireRoom(type, roomId);

      const timing = this.timing(state);

      if (player === "blue") state.pendingBlue = value;
      else state.pendingRed = value;

      state.replayEvents = appendReplayEvent(state, { type: "pending", side: player, value }, this.nowSeconds());

      await this.repository.save(type, state);

      logger.info("Pending", { draftType: type, roomId, side: player, step: state.step, value, ...timing });

      // As in Python, previews are persisted and returned only to their submitting client.
      return stateForClient(state, side);
    });
  };

  public action = async (type: DraftType, roomId: string, step: number, value: string | null): Promise<RoomState> => {
    return this.locks.run(roomKey(type, roomId), async () => {
      const state = await this.requireRoom(type, roomId);

      if (!state.readyBlue || !state.readyRed)
        throw new RequestError(400, "Both teams must be ready before the draft can start");

      if (state.done) throw new RequestError(400, "Draft is already complete");

      const timing = this.timing(state);

      if (step !== state.step) {
        logger.warn("Action rejected: step mismatch", {
          draftType: type,
          roomId,
          step: state.step,
          submittedStep: step,
          expectedStep: state.step,
          ...timing,
        });

        throw new RequestError(409, `Step mismatch: expected ${state.step}, got ${step}`);
      }

      const sequence = "maps" in state ? SEQUENCE_MAPPING[state.bestOf] : STRIKER_SEQUENCE;
      const action = sequence?.[state.step]?.action;

      const side = this.advance(state, value);

      await this.repository.save(type, state);
      this.timerManager.schedule(type, state);

      this.connections.broadcast(type, state);

      logger.info("User action", { draftType: type, roomId, step, side, action, value, ...timing });

      return stateForClient(state, side);
    });
  };

  private advance = (state: RoomState, value: string | null, now = this.nowSeconds()): PlayingSide => {
    const step = state.step;
    const result = "maps" in state ? applyMapAction(state, value ?? "") : applyStrikerAction(state, value);
    const side = result.side;

    Object.assign(state, result.state);

    state.replayEvents = appendReplayEvent(state, { type: "action", side, step, value }, now);
    state.pendingBlue = null;
    state.pendingRed = null;
    state.stepStartedAt = state.done ? null : this.nowSeconds();

    return side;
  };

  public update = async (type: DraftType, roomId: string, update: (state: RoomState) => void): Promise<RoomState> => {
    return this.locks.run(roomKey(type, roomId), async () => {
      const state = await this.requireRoom(type, roomId);

      update(state);

      await this.repository.save(type, state);

      this.connections.broadcast(type, state);

      return stateForClient(state);
    });
  };

  public reconnect = async (
    type: DraftType,
    roomId: string,
    onState: (state: RoomState | null) => void,
  ): Promise<boolean> => {
    return this.locks.run(roomKey(type, roomId), async () => {
      if (this.stopped) return false;

      const state = await this.repository.get(type, roomId);

      if (this.stopped) return false;

      onState(state);

      if (state && !this.timerManager.has(type, roomId)) this.timerManager.schedule(type, state);

      return true;
    });
  };

  public autoAdvance = async (type: DraftType, roomId: string, timer: RoomTimer): Promise<void> => {
    const key = roomKey(type, roomId);
    const fireTime = this.nowSeconds();

    await this.locks.run(key, async () => {
      if (this.stopped || !this.timerManager.isCurrent(type, roomId, timer)) {
        this.logSkippedAdvance(type, roomId, timer, this.stopped ? "shutdown" : "superseded");

        return;
      }

      const state = await this.repository.get(type, roomId);

      if (this.stopped || !this.timerManager.isCurrent(type, roomId, timer)) {
        this.logSkippedAdvance(type, roomId, timer, this.stopped ? "shutdown" : "superseded", state);

        return;
      }

      this.timerManager.remove(type, roomId, timer);
      if (!state || state.done || state.step !== timer.step) {
        this.logSkippedAdvance(
          type,
          roomId,
          timer,
          !state ? "room_missing" : state.done ? "draft_complete" : "step_mismatch",
          state,
        );

        return;
      }

      const sequence = "maps" in state ? SEQUENCE_MAPPING[state.bestOf] : STRIKER_SEQUENCE;
      const entry = sequence?.[state.step];

      if (!entry) {
        this.logSkippedAdvance(type, roomId, timer, "no_remaining_steps", state);

        return;
      }

      const pending = entry.team === "blue" ? state.pendingBlue : state.pendingRed;
      const timing = this.timing(state, fireTime);
      let chosen: string | null;

      if ("maps" in state) {
        const available = state.maps.filter((map) => !state.actions.some((a) => a.map === map));

        if (!available.length) {
          this.logSkippedAdvance(type, roomId, timer, "empty_pool", state);

          return;
        }

        chosen = pending && available.includes(pending) ? pending : this.choose(available);
      } else {
        const available = STRIKER_POOL.filter((striker) => !state.actions.some((a) => a.striker === striker));

        if (entry.action === "ban") chosen = pending && available.includes(pending) ? pending : null;
        else {
          if (!available.length) {
            this.logSkippedAdvance(type, roomId, timer, "empty_pool", state);

            return;
          }

          chosen = pending && available.includes(pending) ? pending : this.choose(available);
        }
      }

      this.advance(state, chosen, fireTime);

      await this.repository.save(type, state);
      this.timerManager.schedule(type, state);

      this.connections.broadcast(type, state);

      logger.info("Auto-advance", {
        draftType: type,
        roomId,
        step: timer.step,
        side: entry.team,
        action: entry.action,
        value: chosen,
        pending,
        ...timing,
      });
    });
  };

  private logSkippedAdvance = (
    type: DraftType,
    roomId: string,
    timer: RoomTimer,
    reason: string,
    state?: RoomState | null,
  ): void => {
    logger.info("Auto-advance skipped", {
      draftType: type,
      roomId,
      step: timer.step,
      expectedStep: timer.step,
      actualStep: state?.step ?? null,
      done: state?.done ?? null,
      reason,
    });
  };

  public stop = (): void => {
    this.stopped = true;
    this.timerManager.stop();
    this.connections.close();
  };
}
