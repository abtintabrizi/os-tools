# Repository agent guidance

This file provides guidance to AI agents when working with code in this repository.

## Required reading and code style

At the start of every task, read this file and all applicable directory-level `AGENTS.md`
files before editing code. For Node backend work, always read `backend/AGENTS.md`,
including its style conventions. Re-read guidance when it changes during a task.

- Use blank lines to separate logical sections; do not pack unrelated operations together.
- Separate top-level declarations and class methods with one blank line.
- Within functions, group related declarations and operations, and separate validation,
  state changes, persistence, notifications, and return values where applicable.
- Keep related simple constants together; separate distinct constant tables and type declarations.
- Do not insert a blank line after every statement or between every object field.
- Prettier preserves intentional blank lines but does not add logical grouping for you.
  Review readability manually after formatting.

## Workspace and validation

The monorepo contains a React/Vite frontend in `frontend/` and an Express 5/TypeScript
backend in `backend/`. The former Python backend is available in Git history.
Read `backend/AGENTS.md` before backend changes for architecture, style, and invariants.

Use Node 24 and the pnpm version pinned in root `package.json`. Run `corepack enable`
once, then `pnpm install --frozen-lockfile` at the root. Do not create npm lockfiles.

- `pnpm dev` starts both apps through Turbo, with Windows shutdown cleanup.
- Keep `shellEmulator: true` in the workspace config: Windows batch wrappers otherwise
  return the shell prompt before the development launcher's cleanup finishes.
- `pnpm build`, `pnpm lint`, and `pnpm typecheck` run both packages' tasks through Turbo.
- `pnpm --filter @os-tools/backend dev` starts only the backend on port 8000.
- `pnpm --filter @os-tools/frontend dev` starts only Vite on port 5173.

After frontend changes, format changed files with `pnpm exec prettier --write <files>`,
run ESLint without warnings, then run the frontend production build. Run these commands
from `frontend/` using `pnpm exec eslint <files> --max-warnings 0` and `pnpm build`.
The build includes TypeScript and Vite validation; lint alone does not check types.
Backend changes require formatting, lint, typecheck, and build as described in its guide.
Report any blocked validation. Use `pnpm.cmd` or `corepack.cmd pnpm` if PowerShell blocks wrappers.
Do not create test files; use temporary command-line smoke checks.

## Button States

- Disabled buttons must use `disabled:cursor-default!` to override the global `button { cursor: pointer; }` rule.
  Use `disabled:opacity-30` or `disabled:opacity-50` when appropriate to indicate unavailable actions.
- Apply hover styles only to enabled buttons, for example `enabled:hover:bg-white/10`. Disabled buttons must not
  change background, border, text color, scale, or other visual styles on hover. If existing unconditional hover
  classes must remain, explicitly override every affected style for the disabled state.
- Selected tool buttons should also have the default cursor and no hover effects while retaining their selected
  styling and full opacity. If using `disabled` for a selected tool, override disabled dimming with
  `disabled:opacity-100!`. Keep accessible labels and selected-state attributes such as `aria-pressed`.

## Maintaining Agent Guidance

After major feature or architecture changes, consider whether adding or updating an `AGENTS.md` in the relevant
directory would help future work. Document useful local conventions, non-obvious behavior, invariants, and validation
requirements, and update guidance that the change makes inaccurate. Keep feature-specific details close to the
feature and repository-wide conventions in this root file.

Do this only when it would be truly helpful. Routine fixes and small changes do not require a new file or an update;
avoid duplicating existing guidance or turning agent instructions into a change log.

## Architecture

This is a monorepo with a separate React frontend and Express/TypeScript backend.

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

Express route functions → managers → Supabase repository, with pure supporting utilities.
`backend/app/server.ts` constructs the application dependencies; `main.ts` loads the
backend environment and starts the server. Read `backend/AGENTS.md` for layer boundaries.

Room mutations, timer advancement, readiness, and linking use locks keyed by draft type
and room ID. Timers and WebSockets are process-local: deploy one backend instance.
Every outgoing room payload must use the shared client-state filter to hide private data.
Existing API paths, WebSocket payloads, and saved Supabase JSON remain compatible.

## Environment

Backend `backend/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `PORT`.
Keep service-role credentials exclusively in the backend.
Frontend `frontend/.env`: optional `VITE_API_BASE_URL`.
See README for development and Render/Vercel deployment commands.
