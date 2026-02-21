## 1. New source files

- [ ] 1.1 Create `packages/arkenv/src/guards.ts` (internal, not a public entry) — extracts the two standard-mode runtime guards from `create-env.ts`:
  - `assertNotArkTypeDsl(key, value)` — throws `ArkEnvError` if value is a string (ArkType DSL)
  - `assertStandardSchema(key, value)` — throws `ArkEnvError` if value lacks `~standard`
- [ ] 1.2 Create `packages/arkenv/src/core.ts` — re-exports `ArkEnvError` (and `InternalValidationError` if needed) from `./errors.ts`
- [ ] 1.3 Create `packages/arkenv/src/standard.ts` — a standalone `createEnv` for Standard Schema mode only
  - Imports guard functions from `./guards.ts` and `parseStandard` from `./parse-standard.ts`
  - No imports of `load-arktype.ts`, `create-env.ts`, or `arktype`

## 2. Update existing source files

- [ ] 2.1 Update `packages/arkenv/src/create-env.ts`:
  - Replace the `loadArkTypeValidator()` dynamic-require call with a direct static import of `parse` from `./arktype/index.ts`
  - Replace the inline standard-mode guards with calls to the shared guard functions from `./guards.ts`
- [ ] 2.2 Delete `packages/arkenv/src/utils/load-arktype.ts` (no longer used after 2.1)
- [ ] 2.3 Update `packages/arkenv/src/index.ts` — add `export { type } from "./arktype/index.ts"` so the main entry exposes `type`

## 3. Build configuration

- [ ] 3.1 Update `packages/arkenv/tsdown.config.ts` entry list:
  - Add `src/core.ts` and `src/standard.ts`
  - Remove `src/arktype/index.ts` as a standalone entry (it remains an internal module imported by `src/index.ts`)
- [ ] 3.2 Update `packages/arkenv/package.json` `exports` map:
  - Add `"./standard"` pointing to `dist/standard.{mjs,cjs,d.mts,d.cts}`
  - Add `"./core"` pointing to `dist/core.{mjs,cjs,d.mts,d.cts}`
  - Remove `"./arktype"` entry

## 4. Tests

- [ ] 4.1 Run the full test suite (`pnpm test --project arkenv -- --run`) and identify any tests that break due to the reorganization
- [ ] 4.2 Update only the broken tests — do not refactor passing tests
  - `isolation.test.ts` mocks `load-arktype.ts` which is deleted; update or replace those tests with assertions against the `standard` entry directly

## 5. Documentation

- [ ] 5.1 Create `packages/arkenv/ARCHITECTURE.md` documenting:
  - The three-tier export surface (`arkenv`, `arkenv/standard`, `arkenv/core`) with a table matching the proposal, plus a note that the ArkType entry wraps definitions with `type()` then delegates to the same core validation path used by `arkenv/standard`
  - The ownership rule: mode-specific exports belong in the mode's entry; mode-agnostic exports belong in `arkenv/core`
  - The single-implementation invariant (Decision 6): ArkType-specific logic belongs in `src/arktype/index.ts#parse`, not in `createEnv` or `src/index.ts`
  - Why `arkenv/standard` ships in the same package rather than as a separate published package

## 6. Validation

- [ ] 6.1 Build the package (`pnpm --filter arkenv build`) and verify all three entries compile without errors
- [ ] 6.2 Confirm `openspec validate refactor-export-surface --strict` passes
