import { randomInt } from "node:crypto";
import { ORPCError } from "@orpc/server";
import {
  COUNTDOWN_SECONDS,
  DraftAction,
  DraftType,
  type MapDraftActionRequest,
  type MapDraftPendingRequest,
  type MapDraftState,
  type PlayingSide,
  type ReadyRequest,
  ReplayEventType,
  type RoomRequest,
  SEQUENCE_MAPPING,
  STRIKER_POOL,
  STRIKER_SEQUENCE,
  type StrikerDraftActionRequest,
  type StrikerDraftPendingRequest,
  type StrikerDraftState,
  Team,
} from "@os-tools/shared";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { ErrorCode } from "../constants/errorCode.js";
import { GameRuleError } from "../gameRuleError.js";
import { applyMapAction } from "../utils/mapDraftUtil.js";
import { appendReplayEvent, stateForClient } from "../utils/replayUtil.js";
import { roomKey } from "../utils/roomUtil.js";
import { applyStrikerAction } from "../utils/strikerDraftUtil.js";
import type { ConnectionManager } from "./connectionManager.js";
import { LoggerManager } from "./loggerManager.js";
import { RoomLockManager } from "./roomLockManager.js";
import type { RoomTimer, TimerManager } from "./timerManager.js";

export interface RoomStateByType {
  [DraftType.MapDraft]: MapDraftState;
  [DraftType.StrikerDraft]: StrikerDraftState;
}

export type RoomState = RoomStateByType[keyof RoomStateByType];

interface RoomRequestsByType {
  [DraftType.MapDraft]: {
    pending: MapDraftPendingRequest;
    action: MapDraftActionRequest;
  };
  [DraftType.StrikerDraft]: {
    pending: StrikerDraftPendingRequest;
    action: StrikerDraftActionRequest;
  };
}

const logger = new LoggerManager("managers.roomManager");

const TABLES: Record<DraftType, string> = {
  [DraftType.MapDraft]: "map_drafts",
  [DraftType.StrikerDraft]: "striker_drafts",
};

export class RoomManager {
  private readonly locks = new RoomLockManager();
  private stopped = false;
  private readonly client: SupabaseClient;

  public constructor(
    private readonly timerManager: TimerManager,
    private readonly connections: ConnectionManager,
    client?: SupabaseClient,
  ) {
    if (client) {
      this.client = client;

      return;
    }

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    }

    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }

  private loadRoom = async <T extends DraftType>(type: T, roomId: string): Promise<RoomStateByType[T] | null> => {
    const { data, error } = await this.client.from(TABLES[type]).select("state").eq("room_id", roomId).maybeSingle();

    if (error) {
      throw new Error(`Failed to load ${type} room: ${error.message}`);
    }

    return (data?.state as RoomStateByType[T] | null) ?? null;
  };

  private saveRoom = async (type: DraftType, state: RoomState): Promise<void> => {
    const { error } = await this.client
      .from(TABLES[type])
      .upsert({ room_id: state.roomId, state }, { onConflict: "room_id" });

    if (error) {
      throw new Error(`Failed to save ${type} room: ${error.message}`);
    }
  };

  public create = async <T extends DraftType>(
    type: T,
    build: (roomId: string) => NoInfer<RoomStateByType[T]>,
  ): Promise<RoomStateByType[T]> => {
    // Serialize ID allocation within this process rather than overwriting an existing room.
    return this.locks.run(`${type}:create`, async () => {
      let id = this.generateRoomId();

      while (await this.loadRoom(type, id)) {
        id = this.generateRoomId();
      }

      const state = build(id);

      await this.saveRoom(type, state);

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

  private nowSeconds = (): number => {
    return Date.now() / 1000;
  };

  private timing = (state: RoomState, now: number = this.nowSeconds()) => {
    return {
      stepStartedAt: state.stepStartedAt ?? null,
      elapsedSeconds: state.stepStartedAt == null ? null : Math.round((now - state.stepStartedAt) * 1000) / 1000,
    };
  };

  private generateRoomId = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    return Array.from({ length: 6 }, () => {
      return chars[randomInt(chars.length)];
    }).join("");
  };

  private choose = <T>(pool: readonly T[]): T => {
    if (!pool.length) {
      throw new Error("Cannot choose from an empty pool");
    }

    return pool[randomInt(pool.length)]!;
  };

  private requireRoom = async <T extends DraftType>(type: T, roomId: string): Promise<RoomStateByType[T]> => {
    const state = await this.loadRoom(type, roomId);

    if (!state) {
      throw new ORPCError(ErrorCode.NotFound, { message: "Room not found" });
    }

    return state;
  };

  public get = async <T extends DraftType>(type: T, { roomId }: RoomRequest): Promise<RoomStateByType[T]> => {
    return stateForClient(await this.requireRoom(type, roomId));
  };

  private playingSide = (side: Team): PlayingSide => {
    if (side !== Team.Blue && side !== Team.Red) {
      throw new ORPCError(ErrorCode.BadRequest, { message: "Invalid side" });
    }

    return side;
  };

  public ready = async <T extends DraftType>(
    type: T,
    { roomId, side }: RoomRequest & ReadyRequest,
  ): Promise<RoomStateByType[T]> => {
    return this.locks.run(roomKey(type, roomId), async () => {
      const state = await this.requireRoom(type, roomId);

      this.playingSide(side);
      const bothReady = state.readyBlue && state.readyRed;

      if (side === Team.Blue) {
        state.readyBlue = true;
      } else {
        state.readyRed = true;
      }

      if (!bothReady && state.readyBlue && state.readyRed) {
        const now = this.nowSeconds();

        state.replayStartedAt = now;
        state.replayEvents = [];
        state.stepStartedAt = now + COUNTDOWN_SECONDS;
      }

      await this.saveRoom(type, state);
      logger.info("Ready", { draftType: type, roomId, side, readyBlue: state.readyBlue, readyRed: state.readyRed });

      if (!bothReady && state.readyBlue && state.readyRed) {
        this.timerManager.schedule(type, state);
      }

      this.connections.broadcast(type, state);

      return stateForClient(state, side);
    });
  };

  public pending = async <T extends DraftType>(
    type: T,
    input: RoomRequest & RoomRequestsByType[NoInfer<T>]["pending"],
  ): Promise<RoomStateByType[T]> => {
    const { roomId, side } = input;
    const value = "map" in input ? input.map : input.striker;
    const player = this.playingSide(side);

    return this.locks.run(roomKey(type, roomId), async () => {
      const state = await this.requireRoom(type, roomId);

      const timing = this.timing(state);

      if (player === Team.Blue) {
        state.pendingBlue = value;
      } else {
        state.pendingRed = value;
      }

      state.replayEvents = appendReplayEvent(
        state,
        { type: ReplayEventType.Pending, side: player, value },
        this.nowSeconds(),
      );

      await this.saveRoom(type, state);

      logger.info("Pending", { draftType: type, roomId, side: player, step: state.step, value, ...timing });

      // As in Python, previews are persisted and returned only to their submitting client.
      return stateForClient(state, side);
    });
  };

  public action = async <T extends DraftType>(
    type: T,
    input: RoomRequest & RoomRequestsByType[NoInfer<T>]["action"],
  ): Promise<RoomStateByType[T]> => {
    const { roomId, step } = input;
    const value = "map" in input ? input.map : input.striker;

    return this.locks.run(roomKey(type, roomId), async () => {
      const state = await this.requireRoom(type, roomId);

      if (!state.readyBlue || !state.readyRed) {
        throw new ORPCError(ErrorCode.BadRequest, { message: "Both teams must be ready before the draft can start" });
      }

      if (state.done) {
        throw new ORPCError(ErrorCode.BadRequest, { message: "Draft is already complete" });
      }

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

        throw new ORPCError(ErrorCode.Conflict, { message: `Step mismatch: expected ${state.step}, got ${step}` });
      }

      const sequence = "maps" in state ? SEQUENCE_MAPPING[state.bestOf] : STRIKER_SEQUENCE;
      const action = sequence?.[state.step]?.action;

      let side: PlayingSide;

      try {
        side = this.advance(state, value);
      } catch (error: unknown) {
        if (error instanceof GameRuleError) {
          throw new ORPCError(ErrorCode.BadRequest, { message: error.message, cause: error });
        }

        throw error;
      }

      await this.saveRoom(type, state);
      this.timerManager.schedule(type, state);

      this.connections.broadcast(type, state);

      logger.info("User action", { draftType: type, roomId, step, side, action, value, ...timing });

      return stateForClient(state, side);
    });
  };

  private advance = (state: RoomState, value: string | null, now: number = this.nowSeconds()): PlayingSide => {
    const step = state.step;
    const result = "maps" in state ? applyMapAction(state, value ?? "") : applyStrikerAction(state, value);
    const side = result.side;

    Object.assign(state, result.state);

    state.replayEvents = appendReplayEvent(state, { type: ReplayEventType.Action, side, step, value }, now);
    state.pendingBlue = null;
    state.pendingRed = null;
    state.stepStartedAt = state.done ? null : this.nowSeconds();

    return side;
  };

  public update = async <T extends DraftType>(
    type: T,
    roomId: string,
    update: (state: NoInfer<RoomStateByType[T]>) => void,
  ): Promise<RoomStateByType[T]> => {
    return this.locks.run(roomKey(type, roomId), async () => {
      const state = await this.requireRoom(type, roomId);

      update(state);

      await this.saveRoom(type, state);

      this.connections.broadcast(type, state);

      return stateForClient(state);
    });
  };

  public reconnect = async <T extends DraftType>(
    type: T,
    roomId: string,
    onState: (state: NoInfer<RoomStateByType[T]> | null) => void,
  ): Promise<boolean> => {
    return this.locks.run(roomKey(type, roomId), async () => {
      if (this.stopped) {
        return false;
      }

      const state = await this.loadRoom(type, roomId);

      if (this.stopped) {
        return false;
      }

      onState(state);

      if (state && !this.timerManager.has(type, roomId)) {
        this.timerManager.schedule(type, state);
      }

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

      const state = await this.loadRoom(type, roomId);

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

      const pending = entry.team === Team.Blue ? state.pendingBlue : state.pendingRed;
      const timing = this.timing(state, fireTime);
      let chosen: string | null;

      if ("maps" in state) {
        const available = state.maps.filter((map) => {
          return !state.actions.some((a) => {
            return a.map === map;
          });
        });

        if (!available.length) {
          this.logSkippedAdvance(type, roomId, timer, "empty_pool", state);

          return;
        }

        chosen =
          pending &&
          available.some((candidate) => {
            return candidate === pending;
          })
            ? pending
            : this.choose(available);
      } else {
        const available = STRIKER_POOL.filter((striker) => {
          return !state.actions.some((a) => {
            return a.striker === striker;
          });
        });

        if (entry.action === DraftAction.Ban) {
          chosen =
            pending &&
            available.some((candidate) => {
              return candidate === pending;
            })
              ? pending
              : null;
        } else {
          if (!available.length) {
            this.logSkippedAdvance(type, roomId, timer, "empty_pool", state);

            return;
          }

          chosen =
            pending &&
            available.some((candidate) => {
              return candidate === pending;
            })
              ? pending
              : this.choose(available);
        }
      }

      this.advance(state, chosen, fireTime);

      await this.saveRoom(type, state);
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
