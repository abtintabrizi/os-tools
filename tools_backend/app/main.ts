import { fileURLToPath } from "node:url";
import { config } from "dotenv";

import { LoggerManager } from "./managers/loggerManager.js";
import { createApplication } from "./server.js";

const logger = new LoggerManager("main");

// Works from app/main.ts in development and dist/main.js in production, regardless of cwd.
config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });

const port = Number(process.env.PORT ?? 8000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const application = createApplication();

application.server.on("error", (error) => {
  logger.error("Server failed", { error });
  process.exitCode = 1;
  application.stop();
});

application.server.listen(port, "0.0.0.0", () => {
  logger.info("Backend listening", { port, host: "0.0.0.0" });
});

let stopping = false;

function shutdown(): void {
  if (stopping) {
    return;
  }

  stopping = true;
  logger.info("Shutdown started");

  const deadline = setTimeout(() => {
    logger.error("Shutdown timed out");
    process.exit(1);
  }, 10000);

  deadline.unref();
  void application.close().then(
    () => {
      clearTimeout(deadline);
      logger.info("Shutdown complete");
    },
    (error: unknown) => {
      logger.error("Shutdown failed", { error });
      process.exitCode = 1;
    },
  );
}

process.on("SIGINT", shutdown);

process.on("SIGTERM", shutdown);
