## 1. Spec & Docs
- [x] 1.1 Add requirement for correct type inference in `openspec/changes/fix-standard-mode-inference/specs/inference/spec.md`.

## 2. Type Implementation
- [x] 2.1 Update `ArkEnvConfig` to be more precise about `validator` types (literals).
- [x] 2.2 Refactor `createEnv` overloads in `packages/arkenv/src/create-env.ts` to support Standard Schema inference.
- [x] 2.3 Fix the return cast in the implementation of `createEnv` for `standard` mode.

## 3. Validation
- [x] 3.1 Verify that `examples/without-arktype/src/index.ts` now has correct type inference (can be checked by hovering or running typecheck).
- [x] 3.2 Add a new test case in `packages/arkenv` specifically for type-level inference of standard mode.
- [x] 3.3 Run `openspec validate fix-standard-mode-inference --strict`.
