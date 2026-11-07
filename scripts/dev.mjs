import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const windows = process.platform === "win32";
const turboRequire = createRequire(require.resolve("turbo/package.json"));
const executable = windows
  ? turboRequire.resolve(
      `@turbo/windows-${process.arch === "arm64" ? "arm64" : "64"}/bin/turbo.exe`,
    )
  : process.execPath;
const args = windows ? [] : [require.resolve("turbo/bin/turbo")];
const turbo = spawn(executable, [...args, "run", "dev", "--ui=stream"], {
  stdio: "inherit",
});

let stopping = false;
let cleanup;

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;

    if (windows) {
      // Console Ctrl+C also reaches Turbo. Give it time to stop the servers,
      // then remove command wrappers stuck at hidden batch-termination prompts.
      cleanup = setTimeout(() => {
        const killer = spawn(
          "taskkill",
          ["/PID", String(turbo.pid), "/T", "/F"],
          {
            stdio: "ignore",
            windowsHide: true,
          },
        );
        killer.on("error", (error) => {
          console.error("Unable to clean up Turbo:", error.message);
          process.exitCode = 1;
        });
      }, 3000);
    } else {
      turbo.kill(signal);
    }
  });
}

turbo.on("error", (error) => {
  console.error("Unable to start Turbo:", error.message);
  process.exitCode = 1;
});

turbo.on("exit", (code) => {
  clearTimeout(cleanup);
  process.exitCode = stopping ? 0 : (code ?? 1);
});
