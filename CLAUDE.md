# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (`frontend/`)
```bash
npm run dev      # Dev server on http://localhost:5173
npm run build    # tsc + vite build (type-check included)
npm run preview  # Preview production build
```

### Backend (`backend/`)
```bash
# Activate venv first (Windows)
source .venv/Scripts/activate

python app/main.py                                          # Dev server on http://127.0.0.1:8000
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload # Equivalent
```

No test suite exists in either package.

## Architecture

This is a monorepo with a separate React frontend and FastAPI backend.

### Frontend

Each draft type is a self-contained feature module under `frontend/src/features/`:

```
features/
  common/           # Shared types, constants (Team, DraftAction), components
  map-drafter/      # Map draft feature
  striker-draft/    # Striker draft feature
```

Each feature follows the same internal pattern:
- `pages/` — SetupPage → LobbyPage → DraftPage (three-step flow)
- `context/` — single React Context + Provider that owns all state for the feature; consumed by pages and components via `useXxxDraftContext()`
- `hooks/useXxxDraftApi` — all HTTP and WebSocket calls; returns state derived from the WebSocket stream
- `constants.ts` — sequence (ban/pick order), pool (available items)
- `types/` — TypeScript types mirroring backend state shapes

The router (`src/app/router.tsx`) nests the three pages under each feature path (`/map-draft`, `/striker-draft`).

Room identity and side assignment live in URL params (`?room=XXXXX&side=blue`). The context reads these on mount and navigates accordingly — if a user lands on the base path with both params set, they're forwarded directly to the draft page.

### Backend

```
app/
  main.py          # FastAPI app, CORS config (localhost:5173, vercel, bestieinslot.com)
  routes/          # One router per feature; both follow identical 6-endpoint patterns
  models/          # Pydantic request models
  constants/       # Game rules: sequences, pools, awakenings, TIMER_SECONDS (30s)
  utils/
    supabase.py    # get_room / save_room (upsert) against two tables
    ws.py          # ConnectionManager: per-room WebSocket lists, broadcast
    map_draft.py   # Timer logic for map draft
    striker_draft.py # Timer logic + generate_random_awakenings
```

Each draft type has 6 endpoints:
- `POST /rooms` — create room, persist initial state
- `GET /rooms/{id}` — fetch current state
- `POST /rooms/{id}/ready` — mark a team ready; starts timer when both sides are ready
- `POST /rooms/{id}/pending` — preview a hovered selection (broadcast only, no step advance)
- `POST /rooms/{id}/action` — validate and apply a ban/pick, advance step, reset/spawn timer
- `WS /ws/rooms/{id}` — stream state to clients; on connect, sends current state and re-spawns timer if a step is in progress

All state is stored in Supabase (`map_drafts` / `striker_drafts` tables). The WebSocket `ConnectionManager` is a plain in-memory dict — it does not persist across server restarts.

### Turn Timer

`TIMER_SECONDS = 30.0` in `backend/app/constants/common.py`. When both teams are ready, the backend spawns an async timer per room. On timeout, it auto-advances the step (treating it as a no-ban on ban steps, or picking randomly on pick steps). `stepStartedAt` (epoch float) is stored in room state so reconnecting clients can compute remaining time client-side.

### Awakening System (Striker Draft)

Each room has two awakenings (one per team), either randomly generated or custom. `AWAKENING_CONFLICTS` in `backend/app/constants/common.py` is a dict mapping each awakening to a list of incompatible ones. Random generation picks two non-conflicting awakenings from `CURRENT_AWAKENING_POOL`.

### Adding a New Draft Type

1. Add constants (sequence, pool) in `backend/app/constants/`
2. Add Pydantic models in `backend/app/models/`
3. Create a new router in `backend/app/routes/` following the 6-endpoint pattern; register it in `routes/routes.py`
4. Create a new feature module in `frontend/src/features/` mirroring the `map-drafter` or `striker-draft` structure
5. Add routes in `frontend/src/app/router.tsx`

## Environment

**Backend** (`backend/.env`):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Frontend** (`frontend/.env`):
- `VITE_API_BASE_URL` — backend base URL; defaults to `http://127.0.0.1:8000` if unset

CORS allowed origins are hardcoded in `backend/app/main.py`.
