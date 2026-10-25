# Shared package

Read this guide and the root AGENTS.md before editing this package.

- Keep common game constants in src/constants/ and transport/state types in src/types/.
- Use camelCase filenames, one blank line between declarations, compact sequence entries,
  and the same 120-column formatting convention as the backend.
- No React, DOM, Node APIs, environment reads, database access, assets, CORS, logging, timers,
  random choices, or mutable process state. Keep package dependencies browser-safe.
- Export through package.json subpaths. Consumers import @os-tools/shared/constants/* or
  @os-tools/shared/types/*; use import type for erased types. Do not use relative cross-package imports.
- Runtime JS and declaration files are compiled to dist/. Do not commit or hand-edit output.
- Turbo builds dependencies before consumers; pnpm dev builds once then watches shared source.
  TypeScript declarations are generated too, so consumer editors update during development.
- Preserve API JSON, nullable no-ban actions, optional decider step, optional legacy replay fields,
  epoch-second timestamps, and millisecond replay offsets. Sequence metadata uses gameNum;
  it is internal rule data, not a persisted API field.
- Do not introduce Zod or oRPC until requested. Shared TypeScript types do not validate network input;
  backend runtime validators remain responsible for that.
- After changes run shared Prettier, lint, typecheck, and build; then run both consumers' checks
  and builds through Turbo. Do not create test files; use temporary smoke commands.
