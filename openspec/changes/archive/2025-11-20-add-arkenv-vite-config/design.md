## Context

Users need to validate unprefixed environment variables (e.g., `PORT`, database credentials) in `vite.config.ts` for server-side configuration, while also validating `VITE_*` variables for client code. The challenge is sharing the schema and typing between:
1. The `loadEnv` call (for validating unprefixed config variables)
2. The `plugins` section (for the `@arkenv/vite-plugin` to validate `VITE_*` variables)

## Goals / Non-Goals

### Goals
- Allow schema to be defined once and reused in both contexts
- Maintain type safety in both contexts
- Follow the spec requirement that schemas must be defined using `type()` function
- Avoid code duplication

### Non-Goals
- Creating a factory pattern wrapper (chosen simpler approach)
- Creating a separate `loadEnv` wrapper utility (not needed with current solution)
- Type augmentation approach (not necessary)

## Decisions

### Decision: Schema Defined Outside `defineConfig` Using `type()`

**What**: Define the schema once outside `defineConfig` using ArkType's `type()` function, then reuse it in both the `loadEnv` call and the plugin.

**Why**: 
- Simplest solution that meets all requirements
- Follows the spec requirement that schemas must be defined using `type()`
- Avoids code duplication
- Maintains type safety in both contexts
- No need for additional wrapper utilities

**Alternatives considered**:
1. **Factory pattern** - More complex, adds abstraction layer
2. **Centralized env file** - Requires separate file, more setup
3. **Type augmentation** - Complex, not necessary for this use case
4. **loadEnv wrapper utility** - Not needed since `createEnv` can accept type definitions directly

### Decision: Extend `createEnv` to Accept Type Definitions

**What**: Modified `createEnv()` and the Vite plugin to accept both:
- Raw schema objects (existing behavior)
- Type definitions created with `type()` (new capability)

**Why**:
- Allows schemas to be defined using `type()` as required by spec
- Maintains backward compatibility with existing raw schema objects
- Enables the schema sharing pattern in vite.config.ts
- Provides full type inference when using type definitions

**Implementation**:
- Added function overloads to handle both raw schemas and type definitions
- Added `InferType<T>` helper type that extracts the inferred type from type definitions by checking their call signature
- Added runtime detection: if `def` has an `assert` method, it's a type definition and used directly
- Otherwise, use `$.type.raw()` to convert raw schema to type definition
- Type inference works correctly: when a type definition is passed, TypeScript infers the return type from the type definition's call signature

## Risks / Trade-offs

### Risks
- Type inference might be less precise when using `type.Any` - **Mitigation**: TypeScript still infers correctly from the schema definition
- Runtime detection adds small overhead - **Mitigation**: Minimal, only checks for `assert` method

### Trade-offs
- Simplicity over flexibility: We chose the simplest solution that works, rather than a more flexible factory pattern
- Backward compatibility: We maintain support for raw schema objects while adding support for type definitions

## Migration Plan

No migration needed - this is a new capability. Existing code using raw schema objects continues to work.

## Open Questions

None - implementation is complete.

