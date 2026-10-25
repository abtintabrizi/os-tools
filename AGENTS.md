# Repository agent guidance

This file provides guidance to AI agents when working with code in this repository.

## Required reading and code style

At the start of every task, read this file and all applicable directory-level `AGENTS.md`
files before editing code. For Node backend work, always read `tools_backend/AGENTS.md`,
including its style conventions. Re-read guidance when it changes during a task.

- Always use explicit braced blocks for control flow (`if`, `else`, loops, and similar
  statements), even for one statement. Put statements on their own lines.
- Frontend arrow functions and callbacks may use concise expression bodies, including
  JSX event handlers and array callbacks. Backend and shared function bodies must use
  explicit braced blocks; follow their directory-level guidance.
- Use blank lines to separate logical sections; do not pack unrelated operations together.
- Separate top-level declarations and class methods with one blank line.
- Within functions, group related declarations and operations, and separate validation,
  state changes, persistence, notifications, and return values where applicable.
- Keep related simple constants together; separate distinct constant tables and type declarations.
- Do not insert a blank line after every statement or between every object field.
- Prettier preserves intentional blank lines but does not add logical grouping for you.
  Review readability manually after formatting.

## Workspace and validation

The monorepo contains a React/Vite frontend in `tools_frontend/` and an Express 5/TypeScript
backend in `tools_backend/`. The former Python backend is available in Git history.
Read `tools_backend/AGENTS.md` before backend changes for architecture, style, and invariants.

Use Node 24 and the pnpm version pinned in root `package.json`. Run `corepack enable`
once, then `pnpm install --frozen-lockfile` at the root. Do not create npm lockfiles.

- `pnpm dev` starts both apps through Turbo, with Windows shutdown cleanup.
- Keep `shellEmulator: true` in the workspace config: Windows batch wrappers otherwise
  return the shell prompt before the development launcher's cleanup finishes.
- `pnpm build`, `pnpm lint`, and `pnpm typecheck` run all workspace packages' tasks through Turbo.
- `pnpm exec turbo run dev --filter=@os-tools/backend...` starts the backend + shared watcher.
- `pnpm exec turbo run dev --filter=@os-tools/frontend...` starts Vite + shared watcher.

After frontend changes, format changed files with `pnpm exec prettier --write <files>`,
run ESLint without warnings from `tools_frontend/` using
`pnpm exec eslint <files> --max-warnings 0`. Then run the frontend production build from
the repository root using `pnpm exec turbo run build --filter=@os-tools/frontend`.
The build includes TypeScript and Vite validation; lint alone does not check types.
Backend changes require formatting, lint, typecheck, and build as described in its guide.
Shared package work requires reading `tools_shared/AGENTS.md`. Cross-app constants/types belong
in its `src/constants/` and `src/types/`; keep assets, UI types, CORS, backend-only types, and timers local.
Import shared definitions directly from `@os-tools/shared`; do not add app-local forwarding
modules or re-export shared definitions through local asset/type files. Keep local modules only
for definitions or behavior owned by that app.
Use Turbo for consumer checks/builds so shared declarations are built first. `pnpm dev` watches shared
changes; do not depend on stale `dist/` files or import shared source via relative paths.
The root `tsconfig.json` lists all workspace projects for editor discovery. Keep it in sync
when adding packages so cross-project reference searches work with only a shared file open.
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

Each draft type is a self-contained feature module under `tools_frontend/src/features/`:

```
features/
  common/           # Shared types, constants (Team, DraftAction), components
  map-drafter/      # Map draft feature
  striker-draft/    # Striker draft feature
```

Each feature follows the same internal pattern:

- `pages/` — SetupPage → LobbyPage → DraftPage (three-step flow)
- `context/` — single React Context + Provider that owns all state for the feature; consumed by pages and components via `useXxxDraftContext()`
- `hooks/useXxxDraftApi` — typed oRPC calls and existing WebSocket updates; the common api.ts owns the client
- `constants.ts` — frontend defaults and presentation configuration; game rules live in shared
- `types/` — local presentation types; import common state types directly from shared

The router (`src/app/router.tsx`) nests the three pages under each feature path (`/map-draft`, `/striker-draft`).

Room identity and side assignment live in URL params (`?room=XXXXX&side=blue`). The context reads these on mount and navigates accordingly — if a user lands on the base path with both params set, they're forwarded directly to the draft page.

### Backend

oRPC procedures → managers (including RoomManager for Supabase access), with pure supporting utilities.
`tools_backend/app/server.ts` constructs the application dependencies; `main.ts` loads the
backend environment and starts the server. Read `tools_backend/AGENTS.md` for layer boundaries.

Room mutations, timer advancement, readiness, and linking use locks keyed by draft type
and room ID. Timers and WebSockets are process-local: deploy one backend instance.
Every outgoing room payload must use the shared client-state filter to hide private data.
HTTP uses shared Zod contracts with no URL prefix (for example /mapDraft/createRoom).
WebSocket paths/payloads and saved Supabase JSON remain compatible.
Keep network schemas and contracts in tools_shared/src/, infer their types, and use the typed frontend client.

## Environment

Backend `tools_backend/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `PORT`.
Keep service-role credentials exclusively in the backend.
Frontend `tools_frontend/.env`: optional `VITE_API_BASE_URL`.
See README for development and Render/Vercel deployment commands.

Import order is enforced by `simple-import-sort/imports` in each TypeScript package.
Keep package imports together and relative imports together. Use relative imports for frontend
source files; do not add path aliases. Workspace packages such as `@os-tools/shared` remain
package imports. Side-effect imports retain their own group and order.
Use the package's `pnpm exec eslint <files> --fix` to fix sorting, then format with Prettier.
VS Code applies ESLint fixes on explicit saves when the ESLint extension is enabled.
