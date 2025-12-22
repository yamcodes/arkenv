# Tasks: Coercion Refactor

- [ ] **Phase 1: Research & Scaffolding**
  - [x] Identify stable `Type.in.json` structure for numbers/booleans (Done in Playground)
  - [ ] Create internal utility `buildCoercionMap` to traverse `in.json` and collect paths

- [ ] **Phase 2: Implementation**
  - [ ] Implement `applyCoercion` utility that uses the map to mutate/copy data with coerced values
  - [ ] Refactor `coerce.ts` to use the Pipeline Wrapper pattern
  - [ ] Remove all usage of `.internal`, `.transform`, and internal node types (`BaseRoot`, `Inner`, etc.)

- [ ] **Phase 3: Validation**
  - [ ] Run `pnpm test` in `packages/arkenv` to ensure zero regressions in `coercion.integration.test.ts`
  - [ ] Verify bundle size remains within limits (<2kB)
  - [ ] Update `ARKTYPE_INTERNALS.md` to remove deleted dependencies
