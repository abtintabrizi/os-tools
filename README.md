# OS Tools — Draft Simulator

A React application for real-time map and striker drafts, spectators, replay playback,
and tactics boards. Live at [drafter.bestieinslot.com](https://drafter.bestieinslot.com).

## Stack and layout

- `tools_frontend/`: React, TypeScript, Vite, Tailwind; hosted on Vercel.
- `tools_backend/`: Express 5, TypeScript, native WebSockets through `ws`; intended for Render.
- Supabase: unchanged `map_drafts` and `striker_drafts` tables, each storing `room_id` and `state`.
- `tools_shared/`: common game constants, API/state types, and replay types.
- `tools_scripts/`: workspace development launcher.
- pnpm workspaces and Turborepo: one install and lockfile for the TypeScript apps.
  Turbo runs development servers, builds, and checks.

Common game rules and types live in `tools_shared/src/constants/` and `tools_shared/src/types/`,
exported by the private `@os-tools/shared` workspace package. UI assets and presentation
types stay in the frontend; CORS, repository interfaces, and runtime resources stay in the backend.
oRPC, Zod schemas, and a test suite are deferred.

## Shared package builds

Both apps depend on `@os-tools/shared` using `workspace:*`; pnpm links the local package.
For example:

```ts
import { TIMER_SECONDS } from "@os-tools/shared/constants/timing";
import type { MapDraftState } from "@os-tools/shared/types/mapDraft";
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
registers Express route functions, and handles HTTP errors, WebSockets, and shutdown.

```text
HTTP route → Manager → Supabase repository
                ↓
          Utility functions
                ↓
     Timer / connection managers
```

- `routes/`: parse and validate HTTP input, call managers, and send responses.
- `managers/`: draft workflows, shared locked room operations, timers, and socket registries.
- `repositories/`: Supabase queries behind the `RoomStore` interface.
- `utils/`: pure draft calculations, replay, state filtering, validation, and error types.
- `models/`, `constants/`: types and game data.

Utilities do not mutate their inputs or read clocks, choose random values, or perform I/O.
Managers own those effects and the room-lock queues; repositories own database access.
Class methods and constructors declare their visibility explicitly.

Managers receive ordinary constructor dependencies. There are no controller/router classes,
decorators, dependency-injection containers, global mutable singletons, or extra bootstrap
layers. Add abstraction only when it serves a concrete responsibility. oRPC remains deferred.

Room loading, modification, persistence, timer updates, and broadcasts stay inside one
shared lock boundary. Routes must not load mutable room state before acquiring that lock.
WebSocket reconnects and automatic actions use the same room manager as HTTP operations.
Existing plain response bodies and `{ detail }` errors are preserved.

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

## Compatibility and API

The backend retains the original API URLs and saved room JSON. No database migration
or frontend API change is required. Each draft type (`map-draft`, `striker-draft`) exposes:

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/{type}/rooms` | Create room |
| GET | `/{type}/rooms/{id}` | Read room |
| POST | `/{type}/rooms/{id}/ready` | Mark side ready |
| POST | `/{type}/rooms/{id}/pending` | Save private preview |
| POST | `/{type}/rooms/{id}/action` | Submit ban/pick with expected step |
| WS | `/{type}/ws/rooms/{id}?side=blue` | Stream side-filtered state |

`POST /map-draft/rooms/{id}/striker-room` links a striker lobby.
`GET /` returns `{ "message": "Backend running" }`.
Errors retain `{ detail }`; malformed requests return 422, missing rooms 404, and stale
steps 409. Unknown map draft formats now return 400 instead of failing later in a timer.

Both-ready starts a five-second countdown followed by 30-second turns. Pending selections
are used on timeout when valid. Otherwise maps are randomly selected for bans/picks;
striker bans become no-bans and striker picks are random. Timestamps remain epoch seconds,
while replay offsets remain milliseconds. Reconnect recovers timers from persisted deadlines.
Rooms predating replay fields remain readable. A restart resumes a room's timer when a
client reconnects, matching Python's behavior.

HTTP compatibility includes case-sensitive paths, 405/Allow responses, trailing-slash
307 redirects, and the same CORS preflight behavior. WebSockets retain Uvicorn's 20-second
ping/pong heartbeat and 16 MiB message limit. Replay rounding matches Python, and timeout
events use the original timer fire time even when storage access takes time.

Node serializes every room mutation, including readiness and lobby linking. Every outgoing
payload hides active replay events and other sides' pending selections. Pending requests
persist and return the caller's preview without broadcasting, matching Python.

Deliberate differences: all room writes are serialized, map/striker runtime registries are
separate, lobby-link payloads are filtered, and generated IDs are checked for collisions.
Invalid map formats are rejected immediately; nullable awakening bans are treated as an
empty ban list. Validation preserves 422/detail responses but uses simpler error messages.
FastAPI's automatic OpenAPI/Swagger/ReDoc pages are not replicated. Node limits JSON request
bodies to 1 MiB; oversized requests return 413 rather than a server error.

## Validation

Backend logs are JSON lines on stdout/stderr, with UTC timestamps, severity, module names,
and selected context fields. Room creation, readiness, previews, manual/automatic actions,
timer starts/cancellations/skips, and stale-step warnings retain the Python diagnostics.
Timing fields are `stepStartedAt` and `elapsedSeconds`; timer starts include `delaySeconds`.
HTTP access logs include method, path, status, and duration, without request bodies or headers.

Do not create test files. Format changed frontend TypeScript with
`pnpm --filter @os-tools/frontend exec prettier --write <files>`, run ESLint, then the
frontend production build through Turbo. For Node, run its `format`, `lint`, `typecheck`, and `build`
scripts. Temporary smoke checks can import `createApplication(store)` from `app/server.ts` to use an isolated
store and ephemeral port. Production uses Supabase exclusively.

Smoke scenarios: all map formats, custom/random awakenings, both sides and spectators,
simultaneous readiness, invalid requests, duplicate actions, stale steps, timer/action races,
no-bans, reconnect, replay, linking, hidden-state filtering, and legacy room payloads.
Use disposable rooms for database checks and remove only those known room IDs afterward.

## Deployment preparation

These are configuration instructions; the migration does not change live services automatically.
Keep existing environment values and the existing backend service URL during cutover.

### Render backend

Configure the existing service with:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root directory | Repository root (blank) |
| Node version | 24, via `.node-version` |
| Build command | `corepack pnpm install --frozen-lockfile && corepack pnpm exec turbo run build --filter=@os-tools/backend` |
| Start command | `corepack pnpm --filter @os-tools/backend start` |
| Health check | `/` |
| Instance count | 1 |

Retain `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; Render supplies `PORT`.
Build filters must include root package/workspace/lock/Turbo/Node-version files as well as
`tools_backend/**` and `tools_shared/**`. Existing CORS allowlists and Vercel preview-origin matching are preserved.

Plan cutover between drafts so Python and Node do not run timers against the same rooms
while Render replaces the process. Check health, room creation, a two-client draft, and
WebSocket reconnect before declaring the cutover complete. Existing rooms need no conversion.

Rollback: deploy the previous Python revision, restore Render's Python runtime and root
`tools_backend`, use `pip install -r requirements.txt` for build and
`uvicorn app.main:app --host 0.0.0.0 --port $PORT` for start. Stop Node before Python serves
rooms. The Python source is available in Git history.

### Vercel frontend

Keep root directory `tools_frontend`, framework Vite, and output directory `dist`. Configure
installation as `corepack pnpm install --frozen-lockfile` and build as
`cd .. && corepack pnpm exec turbo run build --filter=@os-tools/frontend`.
Allow access to files outside the root directory so Vercel sees the root workspace and lockfile.
Use Node 24 and retain `VITE_API_BASE_URL`. Keep the existing SPA rewrite in `vercel.json`.
The committed pnpm lockfile replaces both npm lockfiles; do not use `npm install` on deployment.
