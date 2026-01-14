## 1. Setup & Refactoring
- [ ] 1.1 Implement `loadArkTypeOrThrow()` and refactor `@repo/scope` to be a lazy-loaded proxy.
- [ ] 1.2 Update `ArkEnvConfig` in `packages/arkenv/src/create-env.ts` to include `validator?: "arktype" | "standard"`.

## 2. ArkType Mode Implementation
- [ ] 2.1 Refactor `createEnv` to use `loadArkTypeOrThrow()` when `validator` is `"arktype"` (or default).
- [ ] 2.2 Ensure ArkType mode supports string DSL, `type()`, coercion, and `onUndeclaredKey`.

## 3. Standard Mode Implementation
- [ ] 3.1 Implement `validateStandard()` helper that handles Standard Schema validation.
- [ ] 3.2 Implement manual validation loop for `standard` mode.
- [ ] 3.3 Ensure `standard` mode does not import or touch ArkType.
- [ ] 3.4 Implement manual coercion logic compatibility for `standard` mode.

## 4. Error Handling
- [ ] 4.1 Update `ArkEnvError` to accept a generic error format compatible with both modes.
- [ ] 4.2 Improve error message for missing ArkType peer dependency.

## 5. Testing
- [ ] 5.1 Add test for `standard` mode with Zod.
- [ ] 5.2 Add test for `standard` mode when ArkType is not installed (may require mocking).
- [ ] 5.3 Add test for ArkType mode throwing when ArkType is missing.

## 6. Cleanup
- [ ] 6.1 Remove old `detectMappingType` and hybrid auto-detection logic.
- [ ] 6.2 Ensure bundle size remains under 2kB.
