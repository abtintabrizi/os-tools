# Shared package

Read this guide and the root AGENTS.md before editing this package.

- Keep common game constants and internal rule types in src/constants/.
  Define network schemas in src/schemas/ and export each inferred type immediately beside its schema.
- Use string enums for named game identities and choices, including teams, actions, and
  sequence formats. Use enum members in rule data and preserve existing serialized values.
- Use camelCase filenames, one blank line between declarations, compact sequence entries,
  and the same 120-column formatting convention as the backend.
  Keep each schema and its inferred type together with no blank line between them;
  use one blank line between schema/type pairs.
- No React, DOM, Node APIs, environment reads, database access, assets, CORS, logging, timers,
  random choices, or mutable process state. Keep package dependencies browser-safe.
- Consumers normally import from @os-tools/shared; /schemas and /constants barrel entries are
  also available. Re-export new public definitions through the matching index.ts files.
  Use import type (or inline type specifiers) for erased types. Shared internals use direct
  relative imports rather than the barrels to avoid cycles. No relative cross-package imports.
- Use named `import type` declarations and named type exports. Do not use inline
  `import("...")` type expressions; alias imported names when constants share their names.
- Runtime JS and declaration files are compiled to dist/. Do not commit or hand-edit output.
  The shared build clears its package-local dist/ before compilation to remove deleted modules.
  Typechecking writes separate incremental metadata under node_modules/.cache/ so it cannot
  interfere with the production build metadata in dist/.
- Turbo builds dependencies before consumers; pnpm dev builds once then watches shared source.
  TypeScript declarations are generated too, so consumer editors update during development.
- Preserve API JSON, nullable no-ban actions, optional decider step, optional legacy replay fields,
  epoch-second timestamps, and millisecond replay offsets. Sequence metadata uses gameNum;
  it is internal rule data, not a persisted API field.
- Define network shapes in src/schemas/ with Zod and colocate their exported inferred types.
  Define browser-safe oRPC contracts in src/contracts/; export schemas and contracts from the root barrel.
  Do not duplicate schemas as handwritten interfaces or use unchecked custom schemas for outputs.
  Managers retain business-rule checks. Contract input/output validation runs on the backend.
- After changes run shared Prettier, lint, typecheck, and build; then run both consumers' checks
  and builds through Turbo. Do not create test files; use temporary smoke commands.

Import order is enforced by `simple-import-sort/imports` in each TypeScript package.
Keep package imports together and relative imports together. Frontend source imports use
relative paths; workspace packages retain package imports. Side-effect imports retain their own group and order.
Use the package's `pnpm exec eslint <files> --fix` to fix sorting, then format with Prettier.
VS Code applies ESLint fixes on explicit saves when the ESLint extension is enabled.
