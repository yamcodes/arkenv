# Design: Bun Plugin for ArkEnv

## Context

Bun provides a universal plugin API that can be used to extend both the runtime and bundler. For ArkEnv, we need to intercept environment variable access during Bun's bundling phase to:

1. Validate environment variables using ArkEnv's schema
2. Transform values (string to boolean, apply defaults, etc.)
3. Filter to only expose prefixed variables (defaults to `BUN_PUBLIC_*`) to client code
4. Statically replace `process.env.VARIABLE` with validated values
5. Provide TypeScript type augmentation

This is similar to how the Vite plugin works, but uses Bun's plugin API instead of Vite's `config` hook.

## Goals

- Provide build-time environment variable validation for Bun applications
- Support full-stack React apps using Bun's `serve` function
- Filter environment variables based on Bun's prefix (defaults to `BUN_PUBLIC_*`)
- Provide type-safe access to environment variables via type augmentation
- Match the developer experience of the Vite plugin

## Non-Goals

- Runtime environment variable validation (handled by core `arkenv` package)
- Support for Bun's native plugin API (onBeforeParse) - JavaScript plugin is sufficient
- Custom prefix configuration in the plugin (uses Bun's default `BUN_PUBLIC_*` or bunfig.toml configuration)

## Decisions

### Decision: Use `onLoad` Hook for Environment Variable Transformation

**What**: Use Bun's `onLoad` plugin hook to intercept module loading and transform `process.env` access.

**Why**: 
- `onLoad` allows us to transform module contents before parsing
- We can replace `process.env.VARIABLE` with validated, transformed values
- This matches the static replacement behavior needed for Bun's bundler
- Similar pattern to how other Bun plugins transform code

**Alternatives considered**:
- `onResolve`: Only changes module paths, doesn't allow content transformation
- `onStart`: Runs once at bundle start, too early for per-module transformation
- `onBeforeParse`: Requires native plugin (NAPI), adds unnecessary complexity

### Decision: Filter Based on Bun's Prefix Configuration

**What**: Filter environment variables to only expose those matching Bun's configured prefix (defaults to `BUN_PUBLIC_*`).

**Why**:
- Matches Bun's default behavior for client-exposed environment variables
- Prevents server-only variables from being exposed to client code
- Consistent with Vite plugin's filtering behavior
- Users can configure prefix via `bunfig.toml` (e.g., `[serve.static] env = "BUN_PUBLIC_*"`)

**Alternatives considered**:
- No filtering: Would expose all variables, including server-only ones (security risk)
- Custom prefix in plugin: Adds complexity, Bun's configuration is authoritative

### Decision: Type Augmentation Similar to Vite Plugin

**What**: Provide `ProcessEnvAugmented` type similar to Vite's `ImportMetaEnvAugmented` for type-safe `process.env` access.

**Why**:
- Provides consistent developer experience with Vite plugin
- Enables TypeScript type checking for environment variables
- Users can augment `process.env` types in their TypeScript declaration files

**Implementation**:
- Create `ProcessEnvAugmented<TSchema, Prefix>` type
- Filter schema to only include variables matching prefix
- Export type from plugin package for user augmentation

### Decision: Package Structure

**What**: Create new package `packages/bun-plugin/` following the same structure as `packages/vite-plugin/`.

**Why**:
- Consistent with existing monorepo structure
- Allows independent versioning and publishing
- Keeps plugin-specific code separate from core library

**Structure**:
```
packages/bun-plugin/
├── src/
│   ├── index.ts          # Main plugin export
│   └── types.ts          # Type augmentation utilities
├── package.json
├── tsconfig.json
└── README.md
```

## Risks / Trade-offs

### Risk: Bun Plugin API Changes

**Mitigation**: 
- Follow Bun's official plugin API documentation
- Test against multiple Bun versions if possible
- Document minimum Bun version requirement

### Risk: Static Replacement Complexity

**Mitigation**:
- Use regex or AST transformation to replace `process.env.VARIABLE` patterns
- Test thoroughly with various access patterns (destructuring, optional chaining, etc.)
- Provide clear error messages if transformation fails

### Risk: Type Augmentation Complexity

**Mitigation**:
- Reuse patterns from Vite plugin's type augmentation
- Leverage existing `@repo/types` package for type inference
- Provide clear documentation and examples

## Migration Plan

### For New Users
- Install `@arkenv/bun-plugin` package
- Configure plugin in Bun build/serve configuration
- Add type augmentation to TypeScript declaration file
- Define environment variable schema

### For Existing Bun Users
- No breaking changes to core `arkenv` package
- Plugin is opt-in, existing code continues to work
- Users can migrate gradually by adding plugin to their build configuration

## Open Questions

- Should the plugin support custom prefix configuration, or always use Bun's configured prefix?
  - **Decision**: Use Bun's configuration (bunfig.toml), no custom prefix option
- How should the plugin handle environment variables accessed via destructuring (e.g., `const { VAR } = process.env`)?
  - **Decision**: Transform during `onLoad` before parsing, handle common patterns
- Should the plugin validate all variables in the schema, or only those matching the prefix?
  - **Decision**: Validate all variables in schema, but only expose prefixed ones to client code (similar to Vite plugin)

