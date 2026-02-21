# Design: Three-Tier Export Surface

## Context

ArkEnv has two validation modes - ArkType (default) and Standard Schema - and needs a deliberate module boundary between them. The current split (`./arktype` vs `.`) maps awkwardly to user intent and leaks ArkType dispatch code into paths that should be ArkType-free.

## Goals / Non-Goals

- **Goals:**
  - `arkenv/standard` users never evaluate ArkType code, even transitively
  - `arkenv/core` is a safe import for any mode
  - Main `arkenv` entry is the clear ArkType-first surface
  - The architecture is documented and enforced via `package.json` exports

- **Non-Goals:**
  - Changing validation logic
  - Splitting into a separate npm package
  - Adding new features

## Decisions

### Decision 1: Main entry becomes statically ArkType-dependent

The current main entry (`src/index.ts`) does not statically import ArkType; it uses a lazy `loadArkTypeValidator()` so that just importing `arkenv` doesn't require ArkType to be installed. After this change, the main entry re-exports `type` from `src/arktype/index.ts`, which statically imports `@repo/scope` → ArkType. This is intentional and documented.

- **Rationale:** The main entry is already labelled "requires ArkType" in the target table. Making the dependency static makes the contract explicit. Users who want ArkType-free imports use `arkenv/standard` or `arkenv/core`.
- **Alternative considered:** Keep lazy loading in the main entry. Rejected - it creates an inconsistency where the main entry advertises ArkType exports but doesn't require it at import time.

### Decision 2: `arkenv/standard` gets its own `createEnv`, not a re-export from `create-env.ts`

`create-env.ts` contains ArkType dispatch logic and, after Decision 5's cleanup, will statically import from `./arktype/index.ts`. A dedicated `src/standard.ts` gives `arkenv/standard` an unambiguous, ArkType-free module root with no dependency on `create-env.ts` whatsoever.

The runtime guards (string-DSL check, `~standard` check) that currently live in `create-env.ts`'s standard branch are extracted into a new internal-only module, `src/guards.ts`. Both `src/standard.ts` and `create-env.ts` import from it. There is no duplication.

- **Rationale:** Guaranteed disjoint module graph without relying on tree-shaking behavior of individual bundlers. Single source of truth for the guard logic.
- `src/guards.ts` is internal and not exposed as a public entry point.

### Decision 3: `arkenv/core` is a thin re-export barrel

`src/core.ts` re-exports only from `src/errors.ts`. `errors.ts` has `import type { ArkErrors } from "arktype"` - a type-only import that is erased by TypeScript and does not appear in the emitted bundle. At runtime, `errors.ts` duck-types ArkErrors via `byPath` property access; no ArkType module is required.

- **Rationale:** `ArkEnvError` is mode-agnostic - it is thrown in both ArkType mode (`ArkErrors` branch) and Standard mode (`ValidationIssue[]` branch). It belongs in core.
- **Risk:** A future refactor could introduce a runtime ArkType import in `errors.ts`, silently breaking the `core` isolation invariant. Mitigation: the `isolation.test.ts` file (or a new dedicated test) should import from the `core` entry and assert that ArkType is not required.

### Decision 4: `./arktype` sub-path is removed (breaking)

The `./arktype` entry was the only place `type` and `parse` were exposed. `type` moves to the main entry. `parse` becomes internal. Users who imported `{ type } from "arkenv/arktype"` update to `{ type } from "arkenv"`.

- **Migration:** Only `type` is relevant to end users. `parse` was always `@internal` (see JSDoc). No public API surface is lost beyond the sub-path rename.

### Decision 5: `loadArkTypeValidator` lazy loader is removed in this PR

The lazy loader (`src/utils/load-arktype.ts`) was necessary when the main entry needed to avoid a static ArkType import. Decision 1 makes the main entry explicitly ArkType-dependent, so the loader serves no isolation purpose. Keeping it means `create-env.ts` pays a dynamic-require cost and a fallback-path search at every call, for zero benefit.

`create-env.ts` is updated to import `parse` directly from `./arktype/index.ts` (static). `load-arktype.ts` is deleted. Tests that mock the loader (`isolation.test.ts`) are updated accordingly as part of task 4.

- **Rationale:** Dead code should not be committed. The loader was tied to the old architecture; removing it closes that chapter cleanly rather than leaving the next contributor to wonder why it exists.

### Decision 6: Single validation implementation - ArkType entry is a thin transformation layer

The main entry's `createEnv` MUST NOT contain ArkType-specific validation logic. Its only ArkType-specific step is calling `type()` (via `$.type.raw()`) on the user's definition to produce a compiled schema. All subsequent validation - `onUndeclaredKey`, coercion, error collection - is handled by `parse` in `src/arktype/index.ts`. `create-env.ts` delegates unconditionally; it has no inline ArkType logic of its own.

This mirrors the standard path: both `create-env.ts` and `src/standard.ts` independently delegate to `parseStandard` (there is no `create-env.ts` → `src/standard.ts` dependency). There is exactly one validation implementation per mode, and neither lives in the entry-point file.

This invariant is stated explicitly to prevent future "helpful" additions of ArkType-specific logic directly into `createEnv`. If ArkType-specific behavior is needed, it belongs in `src/arktype/index.ts#parse`, not in `create-env.ts`. The invariant is also surfaced in `ARCHITECTURE.md`.

## Risks / Trade-offs

- **Breaking change** - removing `./arktype`. Mitigated by clear migration path (`type` → `arkenv` main).
- **Isolation test churn** - `isolation.test.ts` mocks `load-arktype.ts` which is deleted. Those tests are updated in task 4; the underlying isolation guarantee is now structural (the standard entry has no loader reference) rather than mock-dependent.
- **Size limit** - the main entry will now include ArkType statically. ArkType is already declared as `external` in `tsdown.config.ts`, so it is excluded from the size measurement. No size-limit impact.

