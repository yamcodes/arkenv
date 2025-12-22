# Proposal: Refactor Coercion to Public API

## Problem

The original coercion implementation relied on undocumented ArkType internal APIs (`.internal`, `.transform`, `.pipe` on internal nodes), making the codebase fragile. A proposed alternative was to use `schema.in.json`, but investigation revealed that while this property is public, it returns an untyped, proprietary internal representation that requires unsafe runtime probing.

## Solution

Switch to a **Standard-Based Data Pre-processing** approach.

Instead of inspecting proprietary ArkType structures (`schema.in.json`) or mutating internals, we will:
1.  Introspect the schema's input requirements using the **standard** `schema.toJsonSchema()` API. This provides a strictly typed, version-controlled JSON Schema (Draft 2020-12).
2.  Identify paths that expect `number` or `boolean` types by traversing standard JSON Schema fields (`type`, `anyOf`, `const`, `enum`).
3.  Pre-process the input data (environment variables) to coerce values at those paths *before* passing the data to ArkType for final validation.
4.  Wrap the original schema in a pipeline: `type("unknown").pipe(applyCoercion).pipe(schema)`.

> **Note**: This refactor introduces **NO BREAKING CHANGES** to the public API. It maintains 100% backward compatibility with the existing `createEnv` function and coercion behavior.

## Impact

- **Reliability**: Relies on a stable external standard (JSON Schema) rather than ArkType's fluctuating internal representation.
- **Type Safety**: `toJsonSchema()` returns a strictly typed `JsonSchema` interface, whereas `in.json` returns loose `JsonStructure` types requiring unsafe assertions.
- **Performance**: Introspection happens once; the pre-processing morph is a simple object traversal.
- **Consistency**: Retains 100% compatibility with existing coercion behavior.

## Implementation Rules

### Code Organization
- **Limit**: Strictly enforce < 200 lines per file. Use `utils/coercion/` directory for modularization if required.
- **Internal Sharing**: Any logic shared across packages must reside in `packages/internal/`.

### Strict Type Safety
- **Standard API only**: Use `schema.toJsonSchema()` for all introspection.
- **No Prop probing**: Do not probe for `domain`, `unit`, or `branches` on generic objects.
- **Avoid Assertions**: Use discriminated unions provided by the `JsonSchema` type definition.
