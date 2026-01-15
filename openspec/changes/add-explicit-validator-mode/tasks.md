## 1. API & Dispatch Setup
- [ ] 1.1 Add `validator?: "arktype" | "standard"` to `ArkEnvConfig`
      (default: `"arktype"`).
- [ ] 1.2 Refactor `createEnv` to act as a strict dispatcher:
      - Branch immediately on `config.validator`
      - No schema inspection or heuristics before branching

## 2. ArkType Loading Boundary
- [ ] 2.1 Implement `loadArkTypeOrThrow()` as the sole ArkType entry point.
- [ ] 2.2 Refactor `@repo/scope` to:
      - Be lazily initialized
      - Be accessed only inside ArkType-mode code paths
- [ ] 2.3 Ensure `standard` mode cannot reach `@repo/scope` (directly or indirectly).

## 3. ArkType Mode Preservation
- [ ] 3.1 Route ArkType mode through existing validation logic.
- [ ] 3.2 Preserve all current behavior:
      - string DSL
      - `type()`
      - coercion
      - `onUndeclaredKey`
- [ ] 3.3 Ensure behavior is byte-for-byte compatible with `main`.

## 4. Standard Mode Implementation
- [ ] 4.1 Define a strict Standard-mode schema contract:
      - Must be an object mapping
      - Each value must implement Standard Schema (`~standard`)
      - Reject strings, `type()`, and compiled ArkType schemas
- [ ] 4.2 Implement `validateStandard()` helper.
- [ ] 4.3 Implement explicit key-by-key validation loop.
- [ ] 4.4 Ensure no ArkType import, require, or proxy is reachable.

## 5. Error Handling
- [ ] 5.1 Normalize Standard Schema errors into a shared internal format.
- [ ] 5.2 Update `ArkEnvError` to accept this generic error shape.
- [ ] 5.3 Provide clear error when:
      - `validator === "arktype"` and ArkType is missing
      - `validator === "standard"` and schema is invalid

## 6. Testing
- [ ] 6.1 Add test: `validator: "standard"` with Zod (happy path).
- [ ] 6.2 Add test: `validator: "standard"` with ArkType missing.
- [ ] 6.3 Add test: ArkType mode throws when ArkType is missing.
- [ ] 6.4 Assert ArkType is never imported or initialized in standard mode.

## 7. Cleanup & Verification
- [ ] 7.1 Remove implicit ArkType assumptions in shared code paths.
- [ ] 7.2 Verify bundle size does not regress.
- [ ] 7.3 Verify `standard` mode tree-shakes ArkType completely.