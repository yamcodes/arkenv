# Design: Explicit Validator Mode

## Context

In `main`, ArkEnv is ArkType-first and ArkType-required:
- All validation flows through ArkType.
- Standard Schema validators are supported only because ArkType supports them.
- There is no supported way to use ArkEnv without ArkType installed.

To support a zero-ArkType runtime path while preserving ArkType as the default and primary engine, ArkEnv needs an explicit execution mode, not additional inference or heuristics.

## Goals
- Allow ArkEnv to run without ArkType installed when explicitly requested.
- Preserve ArkType as the default and first-class engine.
- Make runtime behavior predictable and debuggable.
- Minimize bundle size and architectural complexity.

## Non-Goals
- Tightening or redesigning type inference.
- Replacing ArkType’s validation semantics.
- Implementing a new validation system.
- Supporting hybrid or auto-detected modes.

## Decisions

### 1. Explicit Mode Selection (No Auto-Detection)

ArkEnv introduces an explicit `validator` option:

`validator?: "arktype" | "standard"`

- **Default**: `"arktype"`
- **No runtime schema detection**.
- **No hybrid execution paths**.

This turns ArkEnv from a heuristic-based system into an explicit dispatcher.

### 2. Centralized ArkType Boundary

A single helper, `loadArkTypeOrThrow()`, acts as the only entry point into ArkType.
- Called only when `validator === "arktype"`.
- Throws a clear, actionable error if ArkType is missing.
- Guarantees that standard mode never touches ArkType (directly or indirectly).

This creates a hard boundary for bundling, testing, mocking, and error handling.

### 3. Single Dispatch Point in `createEnv`

All branching happens exactly once:

```ts
export function createEnv(def, config) {
  const mode = config.validator ?? "arktype"

  if (mode === "standard") {
    return validateStandard(def, config)
  }

  return validateArkType(def, config)
}
```

`createEnv` becomes a dispatcher, not a detector.

### 4. Standard Mode Semantics

In `standard` mode:
- Schema must be an object mapping.
- Each value must implement Standard Schema (`~standard`).
- ArkType DSL strings are rejected.
- Compiled ArkType schemas are rejected.

**Coercion**:
- ArkEnv performs only **mechanical coercion**:
  - `string` → `number`
  - `string` → `boolean`
  - `string` → `array` (comma / json)
- No semantic coercion or refinements.
- The Standard Schema validator remains authoritative.

This mode is intentionally minimal and predictable.

### 5. ArkType Mode Semantics

In `arktype` mode (default):
- Behavior is identical to `main`.
- Supports:
  - ArkType DSL.
  - `type()` schemas.
  - Standard Schema validators via ArkType.
  - Existing coercion and `onUndeclaredKey`.

ArkType remains the primary engine.

### 6. Internal Proxies (Implementation Detail)

Proxies may be used internally to support ArkType ergonomics, but:
- They are not part of the public API.
- They are only reachable in `arktype` mode.
- They are never initialized in `standard` mode.

They are a containment mechanism, not a design primitive.

## Risks / Trade-offs
- **Duplication**: Standard mode reimplements minimal coercion logic.
- **Config divergence**: Some ArkType-specific options may behave differently.
- **Inference limits**: Type refinement is deferred.

All are intentional trade-offs for clarity and simplicity.

## Migration Plan
- No breaking changes.
- Existing users remain on ArkType mode.
- Standard mode is opt-in and explicit.
