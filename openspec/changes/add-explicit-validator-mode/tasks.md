## 1. Setup & Refactoring
- [ ] 1.1 Add `validator?: "arktype" | "standard"` to `ArkEnvConfig`.
- [ ] 1.2 Implement `loadArkTypeOrThrow()` and refactor `@repo/scope` to be lazy-loaded
      and only accessed in `arktype` mode.

## 2. ArkType Mode Implementation
- [ ] 2.1 Refactor `createEnv` to branch immediately on `validator === "arktype"` (default).
- [ ] 2.2 Use `loadArkTypeOrThrow()` as the single entry point for ArkType access.
- [ ] 2.3 Ensure ArkType mode preserves existing behavior:
      - string DSL
      - `type()`
      - coercion
      - `onUndeclaredKey`

## 3. Standard Mode Implementation
- [ ] 3.1 Implement `validateStandard()` helper for Standard Schema validation.
- [ ] 3.2 Implement explicit key-by-key validation loop for `standard` mode.
- [ ] 3.3 Ensure `standard` mode does not import, require, or reference ArkType.
- [ ] 3.4 Apply minimal, predictable coercion only where explicitly supported;
      defer advanced coercion semantics to the Standard Schema validator itself.

## 4. Error Handling
- [ ] 4.1 Normalize validation results into a shared internal error shape.
- [ ] 4.2 Update `ArkEnvError` to accept this generic error format.
- [ ] 4.3 Improve error messaging when `arktype` is required but missing.

## 5. Testing
- [ ] 5.1 Add test for `standard` mode using Zod.
- [ ] 5.2 Add test for `standard` mode with ArkType unavailable (mocked).
- [ ] 5.3 Add test for ArkType mode throwing when ArkType is missing.
- [ ] 5.4 Assert `standard` mode does not import or load ArkType.

## 6. Cleanup
- [ ] 6.1 Remove legacy hybrid auto-detection logic.
- [ ] 6.2 Verify bundle size does not regress.
