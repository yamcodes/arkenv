# Change: Add Explicit Validator Mode

## Why
Currently, `arkenv` attempts to auto-detect whether a schema is an ArkType schema or a Standard Schema. This leads to complex runtime branching and makes it difficult to use `arkenv` without `arktype` installed, even when only Standard Schemas are used, undermining `arktype`’s status as an optional peer dependency. By introducing an explicit `validator` mode, we can simplify the runtime path, allow `arkenv` to be used without `arktype` when in `standard` mode, and provide better error messages.

## What Changes
- **ADDED** `validator?: "arktype" | "standard"` to `ArkEnvConfig`.
  - Default is `"arktype"` for backward compatibility.
- **REFACTORED** `createEnv` to branch immediately based on `config.validator`.
- **REMOVED** hybrid auto-detection logic (`detectMappingType`, etc.).
- **IMPLEMENTED** `standard` mode which works without importing or touching `arktype`.
- **IMPLEMENTED** centralized `loadArkTypeOrThrow()` for `arktype` mode to handle missing peer dependency gracefully.
- **NON-GOAL**: This change does not attempt to improve or tighten type inference. Type-level refinements will be handled in a follow-up PR once the runtime behavior is stabilized.

## Impact
- Affected specs: `core` (new), `internal-types`.
- Affected code: `packages/arkenv/src/create-env.ts`, `packages/internal/scope/src/index.ts`.

## Behavioral Changes
- Default behavior (`validator: "arktype"`) is unchanged.
- Users who rely exclusively on Standard Schema validators may now opt into `validator: "standard"` and remove `arktype` from their dependency tree.
