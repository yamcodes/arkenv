# Change: Add Explicit Validator Mode (ArkType vs Standard)

## Context (Current State in `main`)

Today, ArkEnv is **ArkType-first and ArkType-required**.

- `createEnv` always routes validation through ArkType.
- ArkType **must** be installed.
- Standard Schema validators (Zod, Valibot, etc.) are supported **only because ArkType supports Standard Schema**.
- There is no supported way to use ArkEnv without ArkType installed.

> ArkEnv supports Standard Schema *via ArkType*, not *instead of ArkType*.

This change introduces an **alternative execution path**, not a refinement of the existing one.

## Why

There is a legitimate use case for:

- Using ArkEnv **without ArkType installed**.
- Validating environment variables using **Standard Schema validators directly**.
- Avoiding ArkType entirely at runtime when it is not needed.

The current architecture cannot support this without:
- Complex auto-detection.
- Lazy loading.
- Proxy-based indirection.

Instead of making ArkType “optionally implicit”, this proposal introduces an **explicit choice**.

## High-Level Idea

Add an explicit `validator` mode to ArkEnv:

```ts
arkenv(schema, { validator: "standard" })
```

This creates two intentionally separate execution paths:

| Mode       | Uses ArkType | Supports ArkType DSL | Requires ArkType |
| ---------- | ------------ | -------------------- | ---------------- |
| `arktype`  | Yes          | Yes                  | Yes              |
| `standard` | No           | No                   | No               |

No auto-detection. No hybrid logic.

## What Changes

### 1. New Configuration Option

ADDED to `ArkEnvConfig`:

`validator?: "arktype" | "standard"`

- **Default**: `"arktype"` (backward compatible).
- **Opt-in** required to avoid ArkType.

### 2. Explicit Branching in `createEnv`

`createEnv` will branch immediately based on `config.validator`:

```ts
export function createEnv(def, config = {}) {
  const mode = config.validator ?? "arktype"

  if (mode === "standard") {
    return validateStandard(def, config)
  }

  return validateArkType(def, config)
}
```

There is no runtime schema auto-detection.

### 3. ArkType Mode (Unchanged Behavior)

In `validator: "arktype"` mode:

- Behavior is identical to `main` today.
- Supports:
  - ArkType string DSL.
  - `type()` schemas.
  - Mixed Standard Schema validators (via ArkType).
  - Existing coercion and `onUndeclaredKey`.
- ArkType must be installed.

**NEW requirement**:
- ArkType loading is centralized via `loadArkTypeOrThrow()`.
- If ArkType is missing, throw a clear, actionable error.

### 4. Standard Mode (New Capability)

In `validator: "standard"` mode:
- ArkEnv MUST NOT import, require, or touch ArkType.
- ArkType may be completely absent from `node_modules`.

**Supported input shape**:

```ts
arkenv(
  {
    PORT: z.number(),
    DATABASE_URL: z.string().url(),
  },
  { validator: "standard" }
)
```

**Rules**:
- Schema must be an object mapping.
- Each value must implement Standard Schema (`~standard`).
- ArkType DSL strings are not allowed.
- Compiled ArkType schemas are not allowed.

Violations must fail fast with clear errors.

### 5. Standard Mode Validation

In `standard` mode:
- Validation is performed by:
  - Iterating keys.
  - Calling `validator["~standard"].validate(value)`.
- Errors are collected and reported via `ArkEnvError`.
- Async validators are rejected (same as today).

### 6. Coercion in Standard Mode

Standard mode still supports ArkEnv-level coercion, when enabled:
- Primitive coercion only:
  - `number`
  - `boolean`
  - `array` (comma / json)
- No schema-level transforms or refinements.
- Standard Schema validators remain authoritative.

This ensures parity with existing ArkEnv ergonomics without recreating a validator engine.

## Explicit Non-Goals
- No type-system tightening in this change.
- No attempt to infer output types differently per mode.
- No auto-detection or hybrid behavior.
- No proxy-based lazy loading exposed to users.

Type refinements may come later, once runtime behavior is stable.

## Behavioral Summary

| Scenario                          | Result                   |
| --------------------------------- | ------------------------ |
| No validator specified            | ArkType mode (unchanged) |
| `validator: "arktype"`            | Requires ArkType         |
| `validator: "standard"`           | ArkType-free execution   |
| ArkType missing + `arktype` mode  | Clear runtime error      |
| ArkType missing + `standard` mode | Works                    |

## Impact

### Code
- `packages/arkenv/src/create-env.ts`
- New `validateStandard` helper.
- New `loadArkTypeOrThrow` utility.
- Minor refactor in `@repo/scope` to support centralized loading.

### Docs
- Add `validator` option to config docs.
- Add “Standard Mode” section under Standard Schema integration.

## Migration Plan
- No breaking changes.
- Existing users remain on ArkType mode.
- Users who want zero-ArkType runtime opt in explicitly.

## Design Principle

**ArkType remains first-class – but no longer mandatory.**

This change trades clever inference for explicit control, simpler code paths, and predictable behavior.
