# Tactics feature

This is the frontend-only whiteboard at `/tactics`, linked from the home page. Repository-level `AGENTS.md`
instructions still apply.

## Architecture

- `pages/TacticsPage.tsx` owns map selection, tool settings, team selection, keyboard shortcuts, and export feedback.
- `hooks/useTacticsBoard.ts` owns immutable board snapshots and undo/redo history. `initialBoard()` creates one
  centered core. State is session-only: leaving the page or refreshing discards it.
- `components/TacticsBoard.tsx` renders the SVG board and handles drawing, movement, deletion, and palette drops.
  Unfinished gestures use preview state and refs; only completed gestures commit to history.
- `components/TacticsToolbar.tsx` contains drawing controls and history/reset/export actions.
- `components/StrikerPalette.tsx` reuses `ALL_STRIKERS` and the shared blue/red team values.
- `geometry.ts` supplies shared geometry; `exportImage.ts` renders PNGs using an offscreen canvas.

## Maps and assets

- Define maps in `../common/constants/constants.ts`, not in a separate tactics asset registry.
- `MapDefinition` is recursive: only `name` is required; `image`, `blurredImage`, `icon`, and `variants` are optional.
- `image` is the normal, non-blurred image (`/maps/<name>.png`). `blurredImage` uses
  `/maps/<name>_Blurred.png`; icons use `/maps/<name>_Icon.png`.
- Clarion's five variants are nested under its parent in `ALL_MAPS`. They have images but no icons or blurred images.
  Keep them out of the top-level draft map list. The parent also has its own normal image.
- `constants.ts` recursively derives `TACTICS_MAPS`: expand nonempty variants instead of offering their parent;
  otherwise include entries with an `image`. Empty/missing variants are safe, and entries without images are skipped.
  Currently this produces 14 options. Names include their parent path and are sorted alphabetically.
- Tactics defaults to Ahten City, falls back to the first available map, and handles an empty map list.
- `/other/Core.png` has transparent padding. `CORE_CROP` identifies the ball area; keep SVG and PNG cropping aligned
  if the source asset changes.

## Behavior to preserve

- Map selection changes only the background. One shared board retains all pieces and drawings across map changes.
- Use the fixed logical board coordinates from `constants.ts`; convert pointer positions through the SVG transform.
  Resizing must preserve object positions. Fit backgrounds without stretching.
- Drawings have stable IDs, points, color, and width. Move translates entire drawings. Pieces render above drawings
  and remain within the board bounds.
- Allow unlimited striker pieces, including duplicates. Team selection affects new drops only. Use `DRAG_TYPE` for
  palette drag data and team-colored borders for placed strikers.
- Keep exactly one core with ID `core`. It is draggable, cannot be deleted, and is recentered by Reset.
- Commit a completed placement, move, drawing, deletion, or reset as one undo step. Never mutate history snapshots
  or commit every pointer movement. New commits clear redo history; map/tool/style/team settings are outside history.
- Escape, pointer cancellation, and lost capture cancel unfinished gestures. History actions, reset, map/tool changes,
  and export also cancel previews.
- Support Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, and Ctrl+Y without intercepting editing in form fields.
- PNG export includes the fitted background, drawings, core, and striker borders, excluding UI and previews. Wait for
  images to load and surface failures. Keep geometry, layering, sizes, colors, and cropping consistent with the SVG.
- Desktop mouse input is the supported target. Do not add persistence, backend calls, or collaboration unless requested.

## Readability and validation

- Use the frontend Prettier configuration (`printWidth: 120`). Add logical blank lines between hooks, handlers,
  processing stages, and before returns; Prettier does not add these for you. Keep related declarations together.
- Do not create test files. After TypeScript changes, format changed files, run ESLint on them, and run
  `npm.cmd run build` from `frontend/`, following the repository instructions.
- Manually verify map switching/resizing, Clarion options, repeated striker placement and team colors, drawing styles,
  moving/deleting objects, permanent core behavior, cancellation, undo/redo/reset, PNG export, and session reset.
  Report browser checks as unverified if no browser is available.
