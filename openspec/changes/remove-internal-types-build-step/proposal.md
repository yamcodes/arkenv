# Change: Remove Internal Types Package Build Step

## Why

The `@repo/types` internal package currently requires a build step (`tsc`) to generate `.d.ts` files in the `dist/` directory, even though it's a types-only package with no runtime code. This contradicts the original design goal of a zero-build types package.

The build requirement exists because:
- tsdown's `dts.resolve` configuration needs declaration files to bundle types correctly
- The `package.json` points to `./dist/index.d.ts` for type resolution
- Without the build step, TypeScript can't resolve the types during the bundling process

This creates unnecessary complexity:
- Requires maintaining a build script and dist directory
- Adds build order dependency (internal types must be built before consuming packages)
- Goes against the original proposal which stated "no build config needed"

## What Changes

- **MODIFIED**: Internal types package configuration to work without a build step
- **MODIFIED**: Package.json to point to source `.ts` files instead of `dist/` directory
- **MODIFIED**: tsdown configuration to resolve types from source files (if possible) or alternative approach
- **REMOVED**: Build script and dist directory requirement from internal types package
- **MODIFIED**: Turborepo configuration to remove build dependency for internal types package

## Impact

- **Affected specs**: `internal-types` capability
- **Affected code**:
  - `packages/internal/types/package.json` - Update exports and types field
  - `packages/internal/types/tsconfig.json` - May need adjustments
  - `packages/arkenv/tsdown.config.ts` - May need `dts.resolve` changes
  - `packages/vite-plugin/tsdown.config.ts` - May need `dts.resolve` changes
  - `turbo.json` - Remove build dependency
- **User-facing**: No breaking changes; this is an internal improvement
- **Build time**: Potentially faster builds (no build step for internal types)
- **Complexity**: Reduced (one less package to build)

