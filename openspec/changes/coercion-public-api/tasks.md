# Tasks: Coercion Refactor

- [x] **Phase 1: Research & Scaffolding**
  - [x] Identify stable `Type.in.json` structure for numbers/booleans (Done in Playground)
  - [x] Create internal utility `findCoercionPaths` to traverse `in.json` and collect paths

- [x] **Phase 2: Implementation**
  - [x] Implement `applyCoercion` utility that uses the results of path finding to mutate/copy data with coerced values
  - [x] Refactor `coerce.ts` to use the Pipeline Wrapper pattern
  - [x] Remove all usage of `.internal`, `.transform`, and internal node types (`BaseRoot`, `Inner`, etc.)

- [x] **Phase 3: Validation**
  - [x] Run `pnpm test` in `packages/arkenv` to ensure zero regressions in `coercion.integration.test.ts`
  - [x] Verify bundle size remains within limits (<2kB)
  - [x] Update `ARKTYPE_INTERNALS.md` to remove deleted dependencies
  - [x] Build package and verify in playground
