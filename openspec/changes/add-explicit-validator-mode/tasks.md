## 1. API Changes
- [x] 1.1 Add `validator` option to `ArkEnvConfig`.
- [x] 1.2 Add `arrayFormat` simplification.

## 2. Dynamic Dispatcher
- [x] 2.1 Refactor `createEnv` into a dispatcher.
- [x] 2.2 Implement `loadArkTypeOrThrow` in `src/utils/arktype.ts`.
- [x] 2.3 Refactor `@repo/scope` to be lazily initialized.
- [x] 2.4 Ensure `standard` mode cannot reach `@repo/scope`.

## 3. ArkType Mode Preservation
- [x] 3.1 Route ArkType mode through existing parsing logic.
- [x] 3.2 Preserve all current behavior (string DSL, `type()`, coercion, `onUndeclaredKey`).
- [x] 3.3 Ensure behavior is compatible with `main` via existing test suite.

## 4. Standard Mode Implementation
- [x] 4.1 Implement strict schema contracts for `standard` mode.
- [x] 4.2 Implement `parseStandard()` helper.
- [x] 4.3 Implement explicit key-by-key parsing loop.
- [x] 4.4 Ensure no ArkType import, require, or proxy is reachable in standard mode.

## 5. Error Handling
- [x] 5.1 Normalize Standard Schema errors into a shared internal format.
- [x] 5.2 Update `ArkEnvError` to accept this generic error shape.
- [x] 5.3 Provide clear error when ArkType is missing in ArkType mode.

## 6. Testing
- [x] 6.1 Add tests for `validator: "standard"` (Zod, etc.).
- [x] 6.2 Verify error messages for both modes.
- [x] 6.3 Verify ArkType lazy loading behavior.

## 7. Cleanup & Verification
- [x] 7.1 Remove implicit ArkType assumptions in shared code paths.
- [x] 7.2 Verify all tests pass across the mono-repo.