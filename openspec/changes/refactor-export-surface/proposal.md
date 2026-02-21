# Change: Reorganize ArkEnv export surface into three tiers

## Why

The current package exposes two entry points: `.` (main - contains `createEnv`, `ArkEnvError`) and `./arktype` (ArkType-specific - contains `type`, `parse`). This is an ad-hoc split that does not communicate intent. Notably:

- The `type` helper (which requires ArkType) lives in a sub-path instead of the main entry, even though ArkEnv is ArkType-first.
- Standard Schema users must opt in via a `validator: "standard"` flag on a `createEnv` that still bundles ArkType dispatch code - there is no dedicated, provably arktype-free entry.
- `ArkEnvError` has no stable `core` home; users who want it in both modes must import from the main ArkType-dependent entry.

## What Changes

- **REMOVED** `./arktype` sub-path export (breaking). Consumers of `type` should import from `arkenv` (main); `parse` becomes internal-only.
- **MODIFIED** main `arkenv` entry (`src/index.ts`): adds `type` (re-exported from the existing `src/arktype/index.ts`). The entry becomes explicitly ArkType-dependent.
- **ADDED** `arkenv/standard` entry (`src/standard.ts`): a clean, ArkType-free `createEnv` for Standard Schema users. No ArkType import exists anywhere in its module graph.
- **ADDED** `arkenv/core` entry (`src/core.ts`): re-exports `ArkEnvError` and other mode-agnostic primitives that are identical across both modes.
- **ADDED** `src/guards.ts` (internal): extracts the standard-mode runtime guards (string-DSL check, `~standard` check) into a shared module imported by both `src/standard.ts` and `src/create-env.ts`. Single source of truth; no duplication.
- **REMOVED** `src/utils/load-arktype.ts`: the lazy ArkType loader is deleted. `create-env.ts` is updated to import `parse` directly from `./arktype/index.ts` (static). Now that the main entry is explicitly ArkType-dependent, the loader serves no purpose.
- **UPDATED** `package.json` `exports` map: adds `./standard` and `./core`, removes `./arktype`.
- **UPDATED** `tsdown.config.ts` entry list: adds `src/standard.ts` and `src/core.ts`, removes `src/arktype/index.ts` as a public entry (it remains an internal module used by the main entry).
- **ADDED** `packages/arkenv/ARCHITECTURE.md` documenting the three-tier export surface, the single-implementation invariant (ArkType entry delegates to `parse`; standard entry delegates to `parseStandard`; no validation logic in the entry files themselves), ownership rules, and reasoning.

## Impact

- Affected specs: new `export-surface` capability; modified `validator-mode`
- Affected code: `packages/arkenv/src/index.ts`, `packages/arkenv/src/create-env.ts`, `packages/arkenv/package.json`, `packages/arkenv/tsdown.config.ts`, new `src/guards.ts`, new `src/standard.ts`, new `src/core.ts`, deleted `src/utils/load-arktype.ts`
- **BREAKING**: `arkenv/arktype` sub-path removed; consumers of `type` update to `import { type } from "arkenv"`
