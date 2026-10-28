# OS Tools — Draft Simulator

A React application for real-time map and striker drafts, spectators, replay playback,
and tactics boards. Live at [drafter.bestieinslot.com](https://drafter.bestieinslot.com).

## Stack and layout

- `tools_frontend/`: React, TypeScript, Vite, Tailwind; hosted on Vercel.
- `tools_backend/`: Express 5, TypeScript, native WebSockets through `ws`; intended for Render.
- Supabase: unchanged `map_drafts` and `striker_drafts` tables, each storing `room_id` and `state`.
- `tools_shared/`: common game constants, API/state types, and replay types.
- `dev.mjs`: workspace development launcher.
- pnpm workspaces and Turborepo: one install and lockfile for the TypeScript apps.
  Turbo runs development servers, builds, and checks.

Common game rules and types live in `tools_shared/src/constants/` and `tools_shared/src/schemas/`,
exported by the private `@os-tools/shared` workspace package. UI assets and presentation
types stay in the frontend; CORS, backend-only types, and runtime resources stay in the backend.
HTTP APIs use contract-first oRPC with Zod input/output validation. A test suite remains deferred.

## Shared package builds

Both apps depend on `@os-tools/shared` using `workspace:*`; pnpm links the local package.
For example:

```ts
import { TIMER_SECONDS, type MapDraftState } from "@os-tools/shared";
```

TypeScript compiles shared source to JavaScript and declaration files in `tools_shared/dist/`.
Production Node imports the JavaScript; TypeScript reads the declarations. Generated files
are ignored by Git. Run `pnpm dev`, `pnpm build`, or `pnpm typecheck` after a fresh install
to create them. An editor opened before that first build may report unresolved package imports.

Turbo's `^build` dependency builds shared before consumer builds, type checks, and dev startup.
During `pnpm dev`, a shared TypeScript watcher rebuilds changes, Vite updates the frontend,
and tsx watches shared JavaScript to restart the backend. No manual rebuild is needed while
that command runs. Types disappear at runtime; constants are real JavaScript values.
Separate deployed apps still need rebuilding/redeploying to receive new shared code.

## Backend request stack

`main.ts` loads configuration and starts the application. `server.ts` wires the dependencies,
mounts oRPC in Express, and handles request logging, WebSockets, and shutdown.

```text
oRPC procedure → Manager → Supabase
                ↓
          Utility functions
                ↓
     Timer / connection managers
```

- `routes/`: implement shared oRPC contracts through managers; oRPC validates inputs and outputs.
- `managers/`: draft workflows, shared locked room operations, timers, and socket registries.
- `RoomManager` also owns Supabase client initialization and private room load/save methods.
- `utils/`: pure draft calculations, replay, and state filtering.
- Shared game types and constants: `tools_shared/src/`; manager-specific types stay beside their manager.

Utilities do not mutate their inputs or read clocks, choose random values, or perform I/O.
Managers own those effects and the room-lock queues; RoomManager owns database access.
Class methods and constructors declare their visibility explicitly.

Managers receive ordinary constructor dependencies. There are no controller/router classes,
decorators, dependency-injection containers, global mutable singletons, or extra bootstrap
layers. Add abstraction only when it serves a concrete responsibility.

Room loading, modification, persistence, timer updates, and broadcasts stay inside one
shared lock boundary. Routes must not load mutable room state before acquiring that lock.
WebSocket reconnects and automatic actions use the same room manager as HTTP operations.
Room payload shapes are preserved. HTTP procedures use the oRPC protocol and ORPCError.

## Local development

Install Node 24, then enable Corepack and install from the repository root:

```sh
corepack enable
pnpm install --frozen-lockfile
```

The root `packageManager` field pins pnpm. On Windows, use `corepack.cmd pnpm` if a pnpm
shim is unavailable; use `.cmd` wrappers when PowerShell execution policy requires them.

Copy `tools_backend/.env.default` to `tools_backend/.env`, and fill in `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`. Environment variables supplied by the host override the local file.
Keep the service-role key server-side.

The frontend optionally reads `tools_frontend/.env` with `VITE_API_BASE_URL`; its default is
`http://localhost:8000`. Use the same URL when configuring local development explicitly.

```sh
pnpm dev                                  # frontend :5173 + Node backend :8000
pnpm exec turbo run dev --filter=@os-tools/backend...   # backend + shared watcher
pnpm exec turbo run dev --filter=@os-tools/frontend...  # frontend + shared watcher
pnpm build                                # both production builds
pnpm lint                                 # both ESLint checks, no warnings
pnpm typecheck                            # both TypeScript checks
pnpm --filter @os-tools/backend start      # compiled Node server (build first)
```

Press Ctrl+C once to stop local development. A small launcher runs Turbo in stream mode
and cleans up stuck Windows command wrappers after three seconds. Production uses the
backend's graceful SIGTERM handler. Cancelled development tasks do not produce a
"2/2 successful" build summary.
The workspace enables pnpm's portable shell so Windows waits for launcher cleanup
before returning the terminal prompt.

The backend loads its environment file relative to its package, regardless of the shell's
working directory. Set `PORT` to override port 8000. It binds to `0.0.0.0` for Render.

**Run one backend instance.** Timers, locks, and sockets live inside one process.
Horizontal scaling requires additional coordination.

## Contracts and API

Shared Zod schemas in `tools_shared/src/schemas/` define request and state shapes.
Each schema exports its inferred TypeScript type directly beside its definition. Internal rule
types such as SequenceStep stay beside their game constants. Contracts in
`tools_shared/src/contracts/` define inputs and outputs without backend code.
Import public definitions from `@os-tools/shared`; shared internals use direct relative imports.

The frontend calls the typed client in `features/common/api.ts`. It uses
`VITE_API_BASE_URL` directly, without an additional URL prefix. Procedure paths are
`/mapDraft/createRoom`, `/mapDraft/ready`, `/strikerDraft/applyAction`, and so on.

Both `rpc.mapDraft` and `rpc.strikerDraft` expose `createRoom`, `getRoom`, `ready`,
`setPending`, and `applyAction`. Map drafts also expose `linkStrikerRoom`.
Room operations take a `roomId`; linking additionally takes `strikerRoomId` for the target.

Zod validates input and output at the server boundary. Managers retain gameplay checks.
Missing rooms produce `NOT_FOUND`, invalid requests or game actions `BAD_REQUEST`, and
stale steps `CONFLICT`. Unexpected failures are logged and returned as generic internal errors.
Request bodies are limited to 1 MiB. Do not manually fetch the old REST endpoints;
they have been removed. No OpenAPI generation, batching, or automatic mutation retries are enabled.

WebSockets remain at `/{map-draft|striker-draft}/ws/rooms/{id}?side=blue`.
They still provide live room state, reconnect recovery, a 20-second ping/pong heartbeat,
and a 16 MiB message limit. `GET /` remains the Render health check and returns
`{ "message": "Backend running" }`.

Saved room JSON and database tables are unchanged. Optional replay fields and map decider
steps remain supported. Timestamps remain epoch seconds; replay offsets remain milliseconds.
Both-ready starts the five-second countdown, then 30-second turns. Room mutations remain
serialized, and outgoing state is filtered before HTTP validation and WebSocket broadcasts.
Active replay events and other sides' pending selections remain private.

Striker creation requires `bannedStarts` and `customAwakenings` arrays, using `[]` when unused.
Custom mode requires exactly two awakenings. Schema validation does not replace manager checks.

## Validation

Application logs are JSON lines on stdout/stderr, with UTC timestamps, severity, module names,
and selected context fields. Room creation, readiness, previews, manual/automatic actions,
timer starts/cancellations/skips, and stale-step warnings retain the Python diagnostics.
Timing fields are `stepStartedAt` and `elapsedSeconds`; timer starts include `delaySeconds`.
Morgan emits plain-text HTTP access logs with method, path, status, response size, and duration,
without query strings, request bodies, or headers. Connection cleanup runs only during shutdown.

Do not create test files. Format changed frontend TypeScript with
`pnpm --filter @os-tools/frontend exec prettier --write <files>`, run ESLint, then the
frontend production build through Turbo. For Node, run its `format`, `lint`, `typecheck`, and `build`
scripts. Temporary smoke checks can import `createApplication(client)` from `app/server.ts` to supply a client with a local mocked transport
and an ephemeral port. Production uses Supabase exclusively.

Smoke scenarios: all map formats, custom/random awakenings, both sides and spectators,
simultaneous readiness, invalid requests, duplicate actions, stale steps, timer/action races,
no-bans, reconnect, replay, linking, hidden-state filtering, and legacy room payloads.
Use disposable rooms for database checks and remove only those known room IDs afterward.

## Deployment preparation

These are configuration instructions; the migration does not change live services automatically.
Keep existing environment values and the existing backend service URL during cutover.

### Render backend

Configure the existing service with:

| Setting        | Value                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Runtime        | Node                                                                                                       |
| Root directory | Repository root (blank)                                                                                    |
| Node version   | 24, via `.node-version`                                                                                    |
| Build command  | `corepack pnpm install --frozen-lockfile && corepack pnpm exec turbo run build --filter=@os-tools/backend` |
| Start command  | `corepack pnpm --filter @os-tools/backend start`                                                           |
| Health check   | `/`                                                                                                        |
| Instance count | 1                                                                                                          |

Retain `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; Render supplies `PORT`.
Build filters must include root package/workspace/lock/Turbo/Node-version files as well as
`tools_backend/**` and `tools_shared/**`. Existing CORS allowlists and Vercel preview-origin matching are preserved.

Deploy the frontend and backend from the same revision as a coordinated cutover between drafts.
Older frontend deployments use REST URLs and cannot call the new HTTP API. The base backend URL
and environment variable names do not change. Check health, room creation, both teams,
spectator updates, replay, and reconnect after deployment.

Rollback both apps to the same pre-oRPC revision. Never run two backend instances against
the same active rooms; locks, timers, and socket registries are process-local. Database records
need no migration. These instructions do not change live services automatically.

### Vercel frontend

Keep root directory `tools_frontend`, framework Vite, and output directory `dist`. Configure
installation as `corepack pnpm install --frozen-lockfile` and build as
`cd .. && corepack pnpm exec turbo run build --filter=@os-tools/frontend`.
Allow access to files outside the root directory so Vercel sees the root workspace and lockfile.
Use Node 24 and retain `VITE_API_BASE_URL`. Keep the existing SPA rewrite in `vercel.json`.
The committed pnpm lockfile replaces both npm lockfiles; do not use `npm install` on deployment.
