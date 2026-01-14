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
We will implement `loadArkTypeOrThrow()` in a new utility file (or within `@repo/scope` if we refactor it). This helper will use `require` or dynamic `import` (if targeting ESM) to load ArkType lazily.
Given we are in a monorepo and `arkenv` is bundled, we need to be careful with how we handle the optional dependency.
Since `arkenv` has `arktype` as a peer dependency, we can try to `import("arktype")` or use a global Proxy as previously attempted but making it internal only.

Actually, the user suggested: "Load ArkType once via a centralized `loadArkTypeOrThrow()` helper."

### 2. Branching in `createEnv`
```typescript
export function createEnv(def, config) {
  const validator = config.validator ?? "arktype"
  if (validator === "standard") {
    return validateStandard(def, config)
  }
  return validateArkType(def, config)
}
```

### 3. standard mode Implementation
In `standard` mode:
- We iterate over the keys in `def`.
- Each value must be a Standard Schema (has `~standard` property).
- Coercion will be performed manually before passing to the validator if `coerce` is true.
- We will collect errors and throw an `ArkEnvError` (refactored to accept a generic error format).

### 4. internal-only Proxies
The `@repo/scope` package will be refactored to provide a lazy-loaded ArkType instance. This instance should only be used internally by `arkenv`.

## Risks / Trade-offs
- **Redundancy**: `standard` mode might duplicate some logic that ArkType already does (like coercion), but this is necessary to avoid the ArkType dependency.
- **Type Inference**: Ensuring `standard` mode has good type inference without ArkType's complex types might be tricky, but the user said "No type-system tightening or inference refactors", so we should try to keep it simple.

## Migration Plan
- No breaking changes for existing users (default is `arktype`).
- New `validator` option allows opting into the zero-ArkType path.
