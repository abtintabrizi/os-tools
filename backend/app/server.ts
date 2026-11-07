import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

import type { DraftType } from "./models/common.js";
import type { RoomStore } from "./models/room.js";
import { RequestError } from "./utils/requestError.js";
import { ConnectionManager } from "./managers/connectionManager.js";
import { MapDraftManager } from "./managers/mapDraftManager.js";
import { StrikerDraftManager } from "./managers/strikerDraftManager.js";
import { RoomManager } from "./managers/roomManager.js";
import { TimerManager } from "./managers/timerManager.js";
import { mapDraftRouter } from "./routes/mapDraft.js";
import { strikerDraftRouter } from "./routes/strikerDraft.js";
import { Logger } from "./managers/logger.js";
import { methodNotAllowed } from "./routes/methodNotAllowed.js";

const logger = new Logger("server");

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://os-tools-theta.vercel.app",
  "https://os-tools-preview.vercel.app",
  "https://drafter2.bestieinslot.com",
  "https://drafter.bestieinslot.com",
]);

const PREVIEW_ORIGIN = /^https:\/\/os-tools-[a-z0-9-]+-os-tools\.vercel\.app$/;
const ALLOWED_METHODS = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"];

const originAllowed = (origin: string) => ALLOWED_ORIGINS.has(origin) || PREVIEW_ORIGIN.test(origin);

// Wire one set of dependencies per application; smoke checks can supply an isolated store.
export function createApplication(repository: RoomStore) {
  const connectionManager = new ConnectionManager();
  const timerManager: TimerManager = new TimerManager((type, roomId, timer) =>
    roomManager.autoAdvance(type, roomId, timer),
  );
  const roomManager: RoomManager = new RoomManager(repository, timerManager, connectionManager);
  const mapDraftManager = new MapDraftManager(roomManager);
  const strikerDraftManager = new StrikerDraftManager(roomManager);
  const app = express();
  let shuttingDown = false;

  app.disable("x-powered-by");
  app.enable("case sensitive routing");
  app.use((req, res, next) => {
    const startedAt = performance.now();

    res.once("finish", () => {
      logger.info("HTTP request", {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Math.round((performance.now() - startedAt) * 1000) / 1000,
        remoteAddress: req.socket.remoteAddress,
      });

      // A request active when close() starts can become idle after the initial idle sweep.
      if (shuttingDown) setImmediate(() => server.closeIdleConnections());
    });

    next();
  });
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const requestedMethod = req.headers["access-control-request-method"];

    if (req.method === "OPTIONS" && origin && requestedMethod) {
      res.vary("Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS.join(", "));
      res.setHeader("Access-Control-Max-Age", "600");

      if (originAllowed(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
      if (req.headers["access-control-request-headers"]) {
        res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"]);
      }

      const failures = [
        ...(!originAllowed(origin) ? ["origin"] : []),
        ...(!ALLOWED_METHODS.includes(String(requestedMethod)) ? ["method"] : []),
      ];

      res
        .status(failures.length ? 400 : 200)
        .type("text/plain")
        .send(failures.length ? `Disallowed CORS ${failures.join(", ")}` : "OK");

      return;
    }

    if (origin) res.setHeader("Access-Control-Allow-Credentials", "true");

    next();
  });
  app.use(
    cors({
      origin: (origin, callback) => callback(null, origin !== undefined && originAllowed(origin)),
      credentials: true,
      methods: ALLOWED_METHODS,
      preflightContinue: true,
    }),
  );
  app.use((req, res, next) => {
    const path = req.path.replace(/\/+$/, "");
    const knownPath =
      /^\/(?:map-draft|striker-draft)\/rooms(?:\/[^/]+(?:\/(?:ready|pending|action))?)?$/.test(path) ||
      /^\/map-draft\/rooms\/[^/]+\/striker-room$/.test(path);

    if (path !== req.path && knownPath) {
      const queryIndex = req.originalUrl.indexOf("?");
      res.redirect(307, path + (queryIndex === -1 ? "" : req.originalUrl.slice(queryIndex)));

      return;
    }

    next();
  });
  app.use(
    express.json({
      limit: "1mb",
      strict: false,
      type: (req) => {
        const contentType = req.headers["content-type"]?.split(";")[0]?.trim().toLowerCase();

        return !contentType || contentType === "application/json" || /^application\/.+\+json$/.test(contentType);
      },
    }),
  );
  app.head("/", methodNotAllowed("GET"));
  app.get("/", (_req, res) => {
    res.json({ message: "Backend running" });
  });
  app.all("/", methodNotAllowed("GET"));
  app.use("/map-draft", mapDraftRouter(mapDraftManager, roomManager));
  app.use("/striker-draft", strikerDraftRouter(strikerDraftManager, roomManager));
  app.use((_req, res) => {
    res.status(404).json({ detail: "Not Found" });
  });
  const errors: ErrorRequestHandler = (error: unknown, req, res, _next) => {
    // Express identifies error middleware by its four-argument signature.
    void _next;
    if (error instanceof RequestError) {
      res.status(error.status).json({ detail: error.detail });

      return;
    }

    if (error instanceof SyntaxError && "body" in error) {
      res.status(422).json({ detail: [{ type: "json_invalid", loc: ["body"], msg: "JSON decode error" }] });

      return;
    }

    if (
      error instanceof Error &&
      "status" in error &&
      typeof error.status === "number" &&
      error.status >= 400 &&
      error.status < 500
    ) {
      res.status(error.status).json({ detail: error.message });

      return;
    }

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
        if (ws.readyState !== ws.CLOSING && ws.readyState !== ws.CLOSED) ws.terminate();
      });
      void roomManager
        .reconnect(match[1] as DraftType, roomId, (state) => {
          if (ws.readyState !== ws.OPEN) return;

          const type = match[1] as DraftType;
          connectionManager.connect(type, roomId, ws, url.searchParams.get("side") ?? "spectator");

          if (state) connectionManager.send(type, state, ws, url.searchParams.get("side") ?? "spectator");
        })
        .then((connected) => {
          if (!connected) ws.terminate();
        })
        .catch((error: unknown) => {
          logger.error("WebSocket room load failed", { draftType: match[1], roomId, error });
          ws.close(1011, "Failed to load room");
        });
    });
  });

  const stop = () => {
    shuttingDown = true;
    roomManager.stop();
  };

  async function close(): Promise<void> {
    stop();

    for (const ws of wss.clients) ws.terminate();

    await Promise.all([
      new Promise<void>((resolve) => wss.close(() => resolve())),
      new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
    ]);
  }

  return { app, server, close, stop };
}
