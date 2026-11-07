import type { DraftType } from "@os-tools/shared";
import { WebSocket } from "ws";

import { stateForClient } from "../utils/replayUtil.js";
import { roomKey } from "../utils/roomUtil.js";
import { LoggerManager } from "./loggerManager.js";
import type { RoomStateByType } from "./roomManager.js";

const logger = new LoggerManager("managers.connectionManager");

export class ConnectionManager {
  private readonly connections = new Map<string, Map<WebSocket, string>>();
  private readonly responsive = new WeakSet<WebSocket>();
  private heartbeat: NodeJS.Timeout | null = null;

  public connect = (type: DraftType, roomId: string, ws: WebSocket, side: string): void => {
    const key = roomKey(type, roomId);
    const room = this.connections.get(key) ?? new Map<WebSocket, string>();

    room.set(ws, side);
    this.connections.set(key, room);
    this.responsive.add(ws);
    ws.on("pong", () => {
      return this.responsive.add(ws);
    });
    ws.on("close", () => {
      return this.disconnect(key, ws);
    });
    ws.on("error", () => {
      this.disconnect(key, ws);
      // Preserve protocol close frames (for example 1009 for an oversized message).
      if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
        ws.terminate();
      }
    });

    // Match Uvicorn's default 20-second ping interval and 20-second pong timeout.
    if (!this.heartbeat) {
      this.heartbeat = setInterval(this.checkHeartbeat, 20000);
      this.heartbeat.unref();
    }
  };

  private checkHeartbeat = (): void => {
    for (const [key, room] of this.connections) {
      for (const [ws, side] of room) {
        if (!this.responsive.has(ws)) {
          logger.warn("WebSocket heartbeat timed out", { roomKey: key, side });
          this.disconnect(key, ws);
          ws.terminate();

          continue;
        }

        if (ws.readyState !== WebSocket.OPEN) {
          this.disconnect(key, ws);

          continue;
        }

        this.responsive.delete(ws);
        ws.ping((error: Error | undefined) => {
          if (error) {
            logger.warn("WebSocket ping failed", { roomKey: key, side, error });
            this.disconnect(key, ws);
            ws.terminate();
          }
        });
      }
    }
  };

  private disconnect = (key: string, ws: WebSocket): void => {
    const room = this.connections.get(key);

    room?.delete(ws);
    if (room?.size === 0) {
      this.connections.delete(key);
    }

    if (this.connections.size === 0 && this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
  };

  public send = <T extends DraftType>(
    type: T,
    state: NoInfer<RoomStateByType[T]>,
    ws: WebSocket,
    side: string,
  ): void => {
    const key = roomKey(type, state.roomId);

    if (ws.readyState !== WebSocket.OPEN) {
      this.disconnect(key, ws);

      return;
    }

    ws.send(JSON.stringify({ ...stateForClient(state, side), serverTime: Date.now() / 1000 }), (error) => {
      if (error) {
        logger.warn("WebSocket send failed", { draftType: type, roomId: state.roomId, side, error });

        this.disconnect(key, ws);
        ws.terminate();
      }
    });
  };

  public broadcast = <T extends DraftType>(type: T, state: NoInfer<RoomStateByType[T]>): void => {
    for (const [ws, side] of this.connections.get(roomKey(type, state.roomId)) ?? []) {
      this.send(type, state, ws, side);
    }
  };

  public close = (): void => {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
    }
    this.heartbeat = null;

    for (const room of this.connections.values()) {
      for (const ws of room.keys()) {
        ws.terminate();
      }
    }

    this.connections.clear();
  };
}
