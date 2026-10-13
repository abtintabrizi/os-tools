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
- `images.ts` caches decoded images for map rendering and export. `hooks/useMapImage.ts` keeps the previous map
  visible until the selected image is decoded and preloads other maps sequentially in the background.

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
- Tactics defaults to Ahten City and falls back to the first available map. The configured tactics map list is expected
  to contain at least one image; do not add an empty-map screen.
- `/other/Core.png` has transparent padding. `CORE_CROP` identifies the ball area; keep SVG and PNG cropping aligned
  if the source asset changes.

## Behavior to preserve

- Map selection changes only the background. One shared board retains all pieces and drawings across map changes.
- Use the fixed logical board coordinates from `constants.ts`; convert pointer positions through the SVG transform.
  Resizing must preserve object positions. Fit backgrounds without stretching.
- The page uses a viewport-height grid with automatic toolbar/palette rows and a flexible board row. The board row
  is a size-query container; fit the board to its available width and height using the logical aspect ratio, capped
  at 1120px wide. Keep palette and toolbar sizing independent of canvas width to avoid resize feedback loops.
- Drawings have stable IDs, points, color, and width. Move translates entire drawings. Pieces render above drawings.
  Dropping a piece outside the board removes it; dropping inside keeps it within the board bounds.
- Allow unlimited striker pieces, including duplicates. Team selection affects new drops only. Use `DRAG_TYPE` for
  palette drag data and team-colored borders for placed strikers.
- Start with one core with ID `core`. It can be dragged or deleted like other pieces. Drag the core icon from the palette
  to restore it at the drop position or reposition the existing core. Reset restores the centered core. Never allow
  duplicate cores. Core palette drops use the value `core` with `DRAG_TYPE` and do not receive a team color.
- Keep the blue/red slider switch beside the palette; it controls new striker drops only.
- Right-click deletes pieces or drawings regardless of the selected tool. All deletions, including dragging pieces
  off the board, are undoable. Striker portraits and borders are circular in the palette, on the board, and in PNGs.
- Map selection belongs in the toolbar. Undo/redo/reset/download use labeled icon buttons. Disabled and active tool buttons
  use the default cursor without hover effects; active tools retain their full opacity.
- Use a three-column grid for the top row: Home, the toolbar, and an empty column equal in width to the Home column.
  Center the toolbar in the flexible middle column and size it to its contents without exceeding that column's width.
  Toolbar controls stay on one row when they fit within that reserved space and wrap into centered rows when needed.
  Keep tool labels visible rather than hiding them or introducing horizontal scrolling to force one row.
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
  moving/deleting objects, dragging pieces off the board, right-click deletion, core removal/restoration, cancellation,
  undo/redo/reset, disabled/active controls, map preloading, PNG export, and session reset.
  Report browser checks as unverified if no browser is available.
