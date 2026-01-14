# Design: Explicit Validator Mode

## Context
ArkEnv currently relies heavily on ArkType's native support for Standard Schemas and its internal branching logic. To make ArkType an optional dependency and simplify the architecture, we need an explicit way to choose the validation engine.

## Goals
- Decouple `standard` mode from ArkType completely.
- Gracefully handle the absence of ArkType when `arktype` mode is requested.
- Maintain backward compatibility (default to `arktype`).
- Minimal bundle size impact.

## Non-Goals
- Improve or tighten type inference for `standard` or `arktype` modes.
- Implement a full-blown validation library (Standard Schema mode relies on external validators).

## Decisions

### 1. Centralized ArkType Loading
We will implement `loadArkTypeOrThrow()` as the single, authoritative crossing point into ArkType-land. 
- If `validator === "standard"`, ArkType must be completely unreachable by the module graph.
- If `validator === "arktype"`, this helper handles the peer-dependency check and returns the lazily-loaded ArkType instance.
- This creates a clear boundary for bundling, testing (mocking), and error reporting.

### 2. Branching in `createEnv`
All runtime branching happens exactly once at the top of `createEnv`. 
```typescript
export function createEnv(def, config) {
  const validator = config.validator ?? "arktype"
  if (validator === "standard") {
    return validateStandard(def, config)
  }
  return validateArkType(def, config)
}
```
This turns `createEnv` from a "detective" (using heuristics) into a "dispatcher" (following an explicit contract). It allows for the removal of all fuzzy runtime heuristics like `detectMappingType`.

### 3. standard mode Implementation
In `standard` mode:
- We iterate over the keys in `def`.
- Each value must be a Standard Schema (has `~standard` property).
- **Coercion**: ArkEnv will perform only *mechanical* coercion (e.g., `"3000"` -> `3000`, `"true"` -> `true`, `"a,b"` -> `["a", "b"]`). It will NOT attempt semantic coercion or refinements that compete with the Standard Schema validator itself.
- Results are normalized into a shared internal error shape for `ArkEnvError`.

### 4. internal-only Proxies
Proxies are used exclusively as an internal containment mechanism within the `@repo/scope` and `arkenv` packages. 
- They are not part of the public API.
- They are only reachable if the user has selected (or defaulted to) `arktype` mode.
- In `standard` mode, the module paths containing these proxies are never traversed or initialized.

## Risks / Trade-offs
- **Redundancy**: `standard` mode duplicates primitive coercion logic to maintain independence from ArkType.
- **Type Inference**: Type-level refinements are deferred to a follow-up PR; current inference remains "best-effort" for the new `validator` choice.
- **Config Divergence**: Certain options (like `onUndeclaredKey`) have specific meanings in ArkType that might slightly differ or require manual implementation in `standard` mode.

## Migration Plan
- No breaking changes for existing users (default is `arktype`).
- New `validator` option allows opting into the zero-ArkType path.
