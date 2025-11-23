# Change: Add Internal Types Package

## Why

Currently, common TypeScript types like `InferType` are duplicated across multiple packages:
- `packages/arkenv/src/create-env.ts` defines `InferType` internally (not exported)
- `packages/vite-plugin/src/types.ts` defines the same `InferType` type

This duplication creates maintenance burden and risk of divergence. Creating an internal types package will:
- Eliminate code duplication
- Provide a single source of truth for shared types
- Enable easier sharing of additional common types in the future
- Keep the core `arkenv` package focused on its public API without exposing internal types

## What Changes

- **ADDED**: New internal types package `@arkenv/internal-types` (not published to npm)
- **ADDED**: Export `InferType` from the internal types package
- **MODIFIED**: `packages/arkenv/src/create-env.ts` to import `InferType` from internal types package
- **MODIFIED**: `packages/vite-plugin/src/types.ts` to import `InferType` from internal types package
- **ADDED**: Package configuration for internal types package (package.json, tsconfig.json, build config)

## Impact

- **Affected specs**: New capability `internal-types`
- **Affected code**:
  - New package: `packages/internal-types/`
  - `packages/arkenv/src/create-env.ts` - Import from internal types
  - `packages/vite-plugin/src/types.ts` - Import from internal types
- **User-facing**: No breaking changes; this is an internal refactoring
- **Bundle size**: Minimal impact (types-only package, no runtime code)

