## 1. New source files

- [ ] 1.1 Create `packages/arkenv/src/core.ts` — re-exports `ArkEnvError` (and `InternalValidationError`, `formatArkErrors`, `formatInternalErrors` if needed) from `./errors.ts`
- [ ] 1.2 Create `packages/arkenv/src/standard.ts` — a standalone `createEnv` for Standard Schema mode only
  - Imports `parseStandard` from `./parse-standard.ts` and `ArkEnvError` from `./errors.ts`
  - Contains the same runtime guards as the `standard` branch of `create-env.ts` (string-DSL check, `~standard` check)
  - No imports of `load-arktype.ts`, `create-env.ts`, or `arktype`

## 2. Update existing source files

- [ ] 2.1 Update `packages/arkenv/src/index.ts` — add `export { type } from "./arktype/index.ts"` so the main entry exposes `type`

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

## 5. Documentation

- [ ] 5.1 Create `ARCHITECTURE.md` at the repo root documenting:
  - The three-tier export surface (`arkenv`, `arkenv/standard`, `arkenv/core`) with a table matching the proposal
  - The ownership rule: mode-specific exports belong in the mode's entry; mode-agnostic exports belong in `arkenv/core`
  - Why `arkenv/standard` ships in the same package rather than as a separate published package

## 6. Validation

- [ ] 6.1 Build the package (`pnpm --filter arkenv build`) and verify all three entries compile without errors
- [ ] 6.2 Confirm `openspec validate refactor-export-surface --strict` passes
