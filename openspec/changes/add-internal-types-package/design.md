## Context

Currently, the `InferType` type is duplicated in two locations:
- `packages/arkenv/src/create-env.ts` (internal, not exported)
- `packages/vite-plugin/src/types.ts` (used for `ImportMetaEnvAugmented`)

This creates maintenance burden and risk of divergence. We need a way to share common types between packages without:
- Exposing internal types in the public API of `arkenv`
- Creating circular dependencies
- Adding unnecessary complexity

## Goals / Non-Goals

**Goals:**
- Eliminate duplication of `InferType` and enable sharing of other common types
- Keep the core `arkenv` package focused on its public API
- Maintain bundle size constraints (types-only package, no runtime code)
- Enable future sharing of additional common types

**Non-Goals:**
- Publishing the internal types package to npm
- Creating a full-featured shared utilities package (types only)
- Breaking existing functionality or public APIs

## Decisions

### Decision: Create Internal Types Package

**What:** Create `packages/internal-types/` as a new workspace package that exports common TypeScript types.

**Why:**
- Provides a single source of truth for shared types
- Keeps internal types separate from public APIs
- Follows monorepo best practices for shared code
- Easy to extend with additional types in the future

**Alternatives considered:**
1. **Export from arkenv package** - Rejected because it would expose internal types in the public API
2. **Keep duplication** - Rejected because it creates maintenance burden and risk of divergence
3. **Put in vite-plugin and import from there** - Rejected because it creates an awkward dependency (arkenv would depend on vite-plugin)

### Decision: Use Workspace Protocol, Not Publish

**What:** The internal types package will use `workspace:*` protocol and will NOT be published to npm.

**Why:**
- It's an internal implementation detail, not part of the public API
- No need for external users to depend on it
- Keeps the package ecosystem simpler

**Alternatives considered:**
1. **Publish as `@arkenv/internal-types`** - Rejected because it's not part of the public API and would add unnecessary complexity
2. **Publish as `@arkenv/types`** - Rejected for same reasons, plus the name suggests it's a public API

### Decision: Package Structure

**What:** The package will have a minimal structure:
- `src/index.ts` - Main entry point exporting all types
- `src/infer-type.ts` - `InferType` type definition
- Standard build configuration (tsconfig.json, tsdown.config.ts)

**Why:**
- Simple structure is easier to maintain
- Follows existing package patterns in the monorepo
- Easy to extend with additional types in the future

**Alternatives considered:**
1. **Single file** - Rejected because it will be easier to maintain as the package grows
2. **More granular structure** - Rejected because it's premature optimization for a small package

## Risks / Trade-offs

### Risks
- **Additional package complexity** - Mitigation: Minimal structure, types-only, no runtime code
- **Build time impact** - Mitigation: Types-only package builds quickly, Turborepo caching helps
- **Dependency management** - Mitigation: Workspace protocol is well-supported, no external dependencies

### Trade-offs
- **Simplicity vs. Reusability**: We're adding a package for better code organization, but it's a small overhead for the benefit of eliminating duplication
- **Internal vs. Public**: Keeping it internal maintains clean public APIs but requires workspace dependencies

## Migration Plan

1. Create the internal types package structure
2. Extract `InferType` to the new package
3. Update `arkenv` and `vite-plugin` to import from internal types
4. Remove duplicate definitions
5. Test to ensure everything works correctly
6. No breaking changes - this is purely internal refactoring

## Open Questions

None - the approach is straightforward and well-defined.

