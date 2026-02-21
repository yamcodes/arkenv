# Design: Three-Tier Export Surface

## Context

ArkEnv has two validation modes — ArkType (default) and Standard Schema — and needs a deliberate module boundary between them. The current split (`./arktype` vs `.`) maps awkwardly to user intent and leaks ArkType dispatch code into paths that should be ArkType-free.

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
- **Alternative considered:** Keep lazy loading in the main entry. Rejected — it creates an inconsistency where the main entry advertises ArkType exports but doesn't require it at import time.

### Decision 2: `arkenv/standard` gets its own `createEnv`, not a re-export from `create-env.ts`

`create-env.ts` contains ArkType dispatch logic and imports `loadArkTypeValidator`. Even though the standard-mode branch never calls the loader, bundlers following the module graph may include it. A dedicated `src/standard.ts` gives an unambiguous, clean module root.

- **Rationale:** Guaranteed disjoint module graph without relying on tree-shaking behavior of individual bundlers.
- **Trade-off:** The standard-mode runtime guards (string-DSL check, `~standard` check) must live in `src/standard.ts`. This is reorganization, not duplication of validation logic; the behavior is identical.

### Decision 3: `arkenv/core` is a thin re-export barrel

`src/core.ts` re-exports only from `src/errors.ts`. `errors.ts` has `import type { ArkErrors } from "arktype"` — a type-only import that is erased by TypeScript and does not appear in the emitted bundle. At runtime, `errors.ts` duck-types ArkErrors via `byPath` property access; no ArkType module is required.

- **Rationale:** `ArkEnvError` is mode-agnostic — it is thrown in both ArkType mode (`ArkErrors` branch) and Standard mode (`InternalValidationError[]` branch). It belongs in core.
- **Risk:** A future refactor could introduce a runtime ArkType import in `errors.ts`, silently breaking the `core` isolation invariant. Mitigation: the `isolation.test.ts` file (or a new dedicated test) should import from the `core` entry and assert that ArkType is not required.

### Decision 4: `./arktype` sub-path is removed (breaking)

The `./arktype` entry was the only place `type` and `parse` were exposed. `type` moves to the main entry. `parse` becomes internal. Users who imported `{ type } from "arkenv/arktype"` update to `{ type } from "arkenv"`.

- **Migration:** Only `type` is relevant to end users. `parse` was always `@internal` (see JSDoc). No public API surface is lost beyond the sub-path rename.

### Decision 5: `loadArkTypeValidator` lazy loader is kept unchanged

Even though the main entry now statically imports ArkType, `create-env.ts` still uses `loadArkTypeValidator()` internally. This is fine: the task does not require changing validation logic. The lazy loader will still run and will succeed because ArkType is statically available. A future cleanup can remove it.

## Risks / Trade-offs

- **Breaking change** — removing `./arktype`. Mitigated by clear migration path (`type` → `arkenv` main).
- **Guard duplication** — `src/standard.ts` repeats guards from `create-env.ts`. Acceptable: it is a reorganization, and the guards are the authority for the standard-mode `createEnv` surface. If guards need changing later, they change in `src/standard.ts` (authoritative for the standard entry) and in `create-env.ts` (authoritative for the main entry's standard branch). They can be deduplicated in a future refactor.
- **Size limit** — the main entry will now include ArkType statically. ArkType is already declared as `external` in `tsdown.config.ts`, so it is excluded from the size measurement. No size-limit impact.

## Open Questions

- Should the `size-limit` config be updated to also measure `dist/standard.mjs` and `dist/core.mjs`? This is worth doing but is out of scope for this reorganization.
