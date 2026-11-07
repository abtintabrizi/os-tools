import { createServer } from "node:http";
import { implement, onError, ORPCError } from "@orpc/server";
import { BodyLimitPlugin, RPCHandler } from "@orpc/server/node";
import { contract, type DraftType, Team } from "@os-tools/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import morgan from "morgan";
import { WebSocketServer } from "ws";

import { ConnectionManager } from "./managers/connectionManager.js";
import { LoggerManager } from "./managers/loggerManager.js";
import { MapDraftManager } from "./managers/mapDraftManager.js";
import { RoomManager } from "./managers/roomManager.js";
import { StrikerDraftManager } from "./managers/strikerDraftManager.js";
import { TimerManager } from "./managers/timerManager.js";
import { mapDraftRouter } from "./routes/mapDraftRouter.js";
import { strikerDraftRouter } from "./routes/strikerDraftRouter.js";

const logger = new LoggerManager("server");

morgan.token<express.Request>("path", (req) => {
  return req.originalUrl.split("?")[0];
});

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://os-tools-theta.vercel.app",
  "https://os-tools-preview.vercel.app",
  "https://drafter2.bestieinslot.com",
  "https://drafter.bestieinslot.com",
]);

const PREVIEW_ORIGIN = /^https:\/\/os-tools-[a-z0-9-]+-os-tools\.vercel\.app$/;

// Wire one set of dependencies per application; smoke checks can supply a client with a local transport.
export function createApplication(client?: SupabaseClient) {
  const connectionManager = new ConnectionManager();
  const timerManager: TimerManager = new TimerManager((type, roomId, timer) => {
    return roomManager.autoAdvance(type, roomId, timer);
  });
  const roomManager: RoomManager = new RoomManager(timerManager, connectionManager, client);
  const mapDraftManager = new MapDraftManager(roomManager);
  const strikerDraftManager = new StrikerDraftManager(roomManager);
  const app = express();

  app.use(morgan(":method :path | status=:status | size=:res[content-length] bytes | duration=:response-time ms"));
  app.use(
    cors({
      origin: [...ALLOWED_ORIGINS, PREVIEW_ORIGIN],
      credentials: true,
    }),
  );
  app.get("/", (_req, res) => {
    res.json({ message: "Backend running" });
  });
  const router = implement(contract).router({
    mapDraft: mapDraftRouter(mapDraftManager, roomManager),
    strikerDraft: strikerDraftRouter(strikerDraftManager, roomManager),
  });
  const handler = new RPCHandler(router, {
    plugins: [new BodyLimitPlugin({ maxBodySize: 1024 * 1024 })],
    interceptors: [
      onError((error) => {
        if (!(error instanceof ORPCError) || error.status >= 500) {
          logger.error("RPC request failed", { error });
        }
      }),
    ],
  });

  app.use(async (req, res, next) => {
    const { matched } = await handler.handle(req, res);

    if (!matched) {
      next();
    }
  });
  app.use((_req, res) => {
    res.status(404).json({ detail: "Not Found" });
  });
  const errors: ErrorRequestHandler = (error: unknown, req, res, _next) => {
    // Express identifies error middleware by its four-argument signature.
    void _next;
    logger.error("Request failed", { method: req.method, path: req.path, error });
    res.status(500).json({ detail: "Internal Server Error" });
  };

  app.use(errors);

  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 * 1024 });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const match = /^\/(map-draft|striker-draft)\/ws\/rooms\/([^/]+)\/?$/.exec(url.pathname);

    if (!match) {
      socket.end("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");

      return;
    }

    let roomId: string;

    try {
      roomId = decodeURIComponent(match[2]!);
    } catch {
      socket.destroy();

      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      // Attach immediately: errors may arrive while the room connection waits for its lock.
      ws.on("error", (error) => {
        logger.error("WebSocket failed", { draftType: match[1], roomId, error });
        if (ws.readyState !== ws.CLOSING && ws.readyState !== ws.CLOSED) {
          ws.terminate();
        }
      });
      void roomManager
        .reconnect(match[1] as DraftType, roomId, (state) => {
          if (ws.readyState !== ws.OPEN) {
            return;
          }

          const type = match[1] as DraftType;
          connectionManager.connect(type, roomId, ws, url.searchParams.get("side") ?? Team.Spectator);

          if (state) {
            connectionManager.send(type, state, ws, url.searchParams.get("side") ?? Team.Spectator);
          }
        })
        .then((connected) => {
          if (!connected) {
            ws.terminate();
          }
        })
        .catch((error: unknown) => {
          logger.error("WebSocket room load failed", { draftType: match[1], roomId, error });
          ws.close(1011, "Failed to load room");
        });
    });
  });

  async function close(): Promise<void> {
    roomManager.stop();

    for (const ws of wss.clients) {
      ws.terminate();
    }

    // Reap keep-alive connections that become idle while active requests finish.
    const idleCleanup = setInterval(() => {
      server.closeIdleConnections();
    }, 50);

    try {
      await Promise.all([
        new Promise<void>((resolve) => {
          wss.close(() => {
            resolve();
          });
        }),
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        }),
      ]);
    } finally {
      clearInterval(idleCleanup);
    }
  }

  return { app, server, close, stop: roomManager.stop };
}
