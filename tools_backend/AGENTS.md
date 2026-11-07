# TypeScript backend

This is the Express + TypeScript backend. The former Python backend is available in Git history.
Use Node 24 and the root-pinned pnpm version. Do not create test files.

## Style conventions — required reading

Read this file before every task touching the Node backend, alongside the root `AGENTS.md`.
Keep these conventions updated when the user establishes a new style preference.

- Always use explicit braced blocks for function bodies (including arrow functions and callbacks)
  and control flow (`if`, `else`, loops, and similar statements), even for one statement.
  Put statements on their own lines; do not use expression-bodied arrows or unbraced guards.
- Use camelCase for TypeScript module filenames, with folder-specific suffixes:
  `routes/*Router.ts`, `managers/*Manager.ts`, and `utils/*Util.ts` (for example,
  `mapDraftRouter.ts`, `roomManager.ts`, and `replayUtil.ts`).
  Preserve existing API paths, database table names, and persisted field names independently
  of filename style. Standard tool configuration filenames keep their conventional names.
- Put one blank line between top-level functions, classes, interfaces, and type declarations.
- Put one blank line between class methods and between class fields and the constructor.
- Declare `public` or `private` explicitly on every class method, arrow-function member,
  and constructor. Use `private` for implementation details and `public` for the intended
  caller-facing API. ESLint enforces explicit member accessibility.
- Keep related scalar constants together, but separate independent arrays, lookup tables,
  and other exported declarations with a blank line. Separate large lookup-table entries
  when each entry spans multiple lines.
- Within functions, use blank lines between logical phases: input parsing, validation,
  state computation, persistence, timer management, broadcasting/logging, and returning.
  Keep closely related declarations or operations together.
- Separate guard clauses from subsequent work and return statements from preceding work
  where that makes the function easier to scan.
- Group all external/package imports together, then one blank line, then all relative/local
  imports together. Do not add blank lines within either group. Keep multiline objects and arrays compact
  internally unless their fields form distinct logical groups.
- Write short, flat object literals on one line when they fit the 120-character print width.
  In sequence arrays, keep one compact object per line. Do not expand these entries manually;
  Prettier preserves an existing newline after `{` rather than automatically compacting it.
- Use a single blank line for separation; avoid both dense walls of code and a blank line
  after every statement. Prettier does not replace a manual readability review.

## Commands

From the repository root:

- `pnpm exec turbo run dev --filter=@os-tools/backend...` — backend + shared watcher, port 8000.
- `pnpm --filter @os-tools/backend exec prettier --write <changed files>`.
- `pnpm --filter @os-tools/backend lint` — no warnings allowed.
- `pnpm --filter @os-tools/backend typecheck`.
- `pnpm exec turbo run build --filter=@os-tools/backend` — build shared, then backend `dist/`.
- `pnpm --filter @os-tools/backend start` — run the compiled server.

Complete formatting, lint, typecheck, and build after changes. Use temporary command-line
smoke checks rather than adding a test suite. `createApplication(client)` supports a client with a local mocked transport and an ephemeral port for checks; production always uses Supabase.

Root `pnpm dev` runs Turbo through `dev.mjs`. On Windows, its bounded cleanup
removes command wrappers stuck at hidden batch prompts after Ctrl+C. Test shutdown in
a real PTY when changing the launcher. Production uses the graceful SIGTERM handler.
During graceful server shutdown, `close()` sweeps idle HTTP connections while active requests
finish and clears its sweep interval in finally. Keep cleanup in shutdown code, not request
logging middleware; newly idle keep-alive sockets can otherwise delay server closure.

## Request stack and architecture

Keep this backend small: route functions → managers, with supporting utility functions.
`server.ts` constructs one set of dependencies per application and registers routes explicitly.
Do not add controller classes, router classes, an API-server class, or a separate bootstrap
layer for simple delegation. No decorators, DI container, or global mutable singletons.

- `routes/`: implement shared oRPC contracts by calling managers. Keep business decisions and
  database access out of procedure handlers. server.ts mounts the Node RPCHandler without a URL prefix.
- `managers/`: classes for draft workflows and stateful resources. Feature managers handle
  room creation and linking; `RoomManager` owns shared locked room operations, clock reads,
  random choices, and room-ID generation. `TimerManager` owns timer handles;
  `ConnectionManager` owns WebSocket registrations and filtered sends. `RoomLockManager`
  owns mutable lock queues. `RoomManager` also owns Supabase initialization and private
  load/save methods; do not add a separate storage manager or forwarding store interface.
- `utils/`: deterministic, side-effect-free supporting functions. Return new values rather than mutating caller-owned state. No I/O,
  logging, timers, locks, shared mutable state, randomness, or implicit clock reads.
  Pass timestamps as arguments; compute valid pools here and select randomly in managers.
  Local mutation of newly created values and throwing validation errors are fine.
  Expected game-rule failures throw the transport-independent GameRuleError from app/gameRuleError.ts.
  Managers translate only GameRuleError into ORPCError for HTTP calls; unexpected errors propagate.
  Utilities must not import oRPC or API error codes; ESLint enforces this boundary.
  Do not create separate one-file `helpers/`, `rules/`, `validators/`, or `errors/` folders.

Use arrow methods for manager methods passed by reference. Return filtered room states;
oRPC validates outputs and serializes responses and errors. Do not add unnecessary layers.
Manager methods called by HTTP procedures accept plain input objects and destructure them
inside the method. RoomManager takes the server-owned DraftType separately and preserves
the relationship between draft type, request shape, and returned state.

Load mutable room state inside the manager's room lock, never before locking in a route.
Timer callbacks and WebSocket reconnects use the same room manager and lock boundaries
as HTTP mutations. Keep persistence, timer updates, and broadcasts ordered under the lock.

## Logging

Use the module-scoped `LoggerManager` from `managers/loggerManager.ts`; it writes JSON lines with UTC
`timestamp`, `level` (`INFO`, `WARNING`, `ERROR`), `module`, and `message`. Keep logging out
of pure utilities. Use selected fields rather than entire requests, states, headers, or env.
Errors retain their name, message, and stack. Never log Supabase credentials.

Preserve Python diagnostics: room creation details, side readiness, pending previews,
submitted actions, stale-step warnings, timer spawn/cancel/skip events, and auto-advances.
Include `draftType` and `roomId`; action/preview logs include `step`, `side`, and `value`.
Capture `stepStartedAt` and `elapsedSeconds` before advancing the state, using null when
no turn has started. Auto-advances also record the original `pending` value. Timer starts
record `delaySeconds`; skipped advances record expected/current steps and the reason.
Morgan supplies plain-text HTTP access logs with labeled status, size in bytes, duration, and a path-only token
(no query strings). Keep LoggerManager for structured application logs; do not reimplement
request timing/logging or mix shutdown cleanup into request logging middleware.

## Python compatibility checks

Use the cors package with the existing frontend origin allowlist and preview regex.
HTTP operations use the oRPC protocol without a URL prefix; old REST handlers are removed.
Let RPCHandler parse bodies and validate shared Zod inputs/outputs. Its Node BodyLimitPlugin
enforces 1 MiB; do not place express.json() before it. Manager gameplay checks remain.

Uvicorn's WebSocket defaults are 20-second pings, a 20-second pong timeout, and a 16 MiB
message limit. Heartbeat handles belong to `ConnectionManager` and must be cleared during
shutdown. Preserve protocol close frames rather than terminating sockets already closing.
Replay offsets use Python's round-half-to-even rule. Auto-advance replay timestamps use
the timer fire time captured before acquiring the lock or waiting for database access.

## Invariants

- Striker creation requires `bannedStarts` and `customAwakenings` as arrays, including when
  empty. Frontend callers supply both; Zod validates request shapes.

- Preserve WebSocket URLs and persisted JSON. HTTP clients must use the shared oRPC contract.
- Common game constants, request/state types, and replay types live in `../tools_shared/src/`.
  Keep server-only configuration and backend-only types local. Read the shared package guide.
- `stepStartedAt`, `replayStartedAt`, and `serverTime` are epoch **seconds**; `atMs` is milliseconds.
- Read/modify/write operations run inside `RoomManager` locks keyed by draft type and room ID.
  Keep timer cancellation, rescheduling, and broadcasts inside the same serialized operation.
- Runtime registries are process-local: use one backend instance. Never serve the same rooms
  across backend instances; a local lock cannot coordinate different processes.
- All client payloads go through `stateForClient`, including linking responses and socket sends.
  Active replay events are omitted; pending selections are visible only to their owning side.
- Pending previews are persisted and returned to the caller, without broadcasting (Python parity).
- A timer must verify its identity and expected step under the room lock before advancing.
- Supabase service-role credentials must never enter frontend code, logs, or Turbo cache inputs.
- Preserve nullable striker actions and legacy rooms without replay fields. Map deciders omit `step`.
- No database schema changes or authentication redesign in this migration.

Import order is enforced by `simple-import-sort/imports` in each TypeScript package.
Keep package imports together and relative imports together. Frontend source imports use
relative paths; workspace packages retain package imports. Side-effect imports retain their own group and order.
Use the package's `pnpm exec eslint <files> --fix` to fix sorting, then format with Prettier.
VS Code applies ESLint fixes on explicit saves when the ESLint extension is enabled.

Use ORPCError with the backend-local ErrorCode enum in app/constants/errorCode.ts.
These errors do not need contract declarations unless custom typed error data is required.
Unexpected failures are logged by the handler
interceptor and remain generic internal errors. Never expose storage error details in error data.
