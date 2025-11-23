## Context

The `@repo/types` internal package was originally designed as a zero-build types-only package. However, it currently requires a build step because:

1. **tsdown's `dts.resolve` limitation**: The `dts.resolve` configuration in tsdown requires declaration files (`.d.ts`) to bundle types correctly. It cannot resolve types directly from source `.ts` files.

2. **Package.json type resolution**: The `package.json` currently points to `./dist/index.d.ts` for type resolution, which requires the build step to generate.

3. **TypeScript module resolution**: During bundling, TypeScript needs resolved declaration files to properly bundle types into consuming packages.

The original design document stated "no build config needed" but this was not achievable with the current tsdown setup.

## Goals / Non-Goals

**Goals:**
- Eliminate the build step requirement for the internal types package
- Maintain type resolution and bundling functionality
- Keep the package as a types-only, zero-runtime-code package
- Preserve the ability to bundle types into consuming packages via tsdown

**Non-Goals:**
- Changing the bundling approach for consuming packages (arkenv, vite-plugin)
- Modifying tsdown itself
- Breaking type resolution for consuming packages
- Adding runtime code to the internal types package

## Decisions

### Decision: Point package.json to Source Files

**What:** Update `package.json` to point `types` and `exports.types` fields directly to source `.ts` files instead of `./dist/index.d.ts`.

**Why:**
- TypeScript can resolve types from source files directly
- No build step needed to generate declaration files
- Simpler package structure (no dist directory needed)
- Aligns with the original "no build config needed" goal

**Alternatives considered:**
1. **Keep dist/ approach** - Rejected because it requires a build step
2. **Use TypeScript project references** - Rejected because it adds complexity and may not work with tsdown
3. **Inline types directly** - Rejected because it reintroduces duplication

### Decision: Investigate tsdown dts.resolve Alternatives

**What:** Explore whether tsdown's `dts.resolve` can work with source files, or if we need an alternative approach.

**Why:**
- `dts.resolve` is currently configured to bundle types from `@repo/types`
- If it can't work with source files, we may need to:
  - Remove `dts.resolve` and let TypeScript resolve types naturally
  - Use a different bundling approach
  - Accept that types won't be bundled (they'll remain as imports)

**Alternatives considered:**
1. **Remove dts.resolve entirely** - Let TypeScript resolve types naturally without bundling
   - Pros: Simplest approach, no build step needed
   - Cons: Types remain as external imports in bundled output
   - Risk: May cause issues if consuming packages need bundled types
2. **Wait for tsdown improvements** - See if future versions support source file resolution
   - Pros: May solve the problem automatically
   - Cons: Unclear timeline, may never happen
3. **Use a different bundler** - Switch from tsdown to another tool
   - Pros: May have better source file support
   - Cons: Major change, may break existing setup

### Decision: Update Turborepo Configuration

**What:** Remove the build dependency for internal types package from Turborepo configuration.

**Why:**
- If the package doesn't need a build step, it shouldn't be in the build pipeline
- Simplifies task dependencies
- Faster builds (one less package to build)

**Implementation:**
- Remove `packages/internal/types` from build dependencies
- Ensure typecheck still works (should work with source files)

## Risks / Trade-offs

### Risks

1. **tsdown bundling may break** - If `dts.resolve` cannot work with source files, types may not bundle correctly
   - **Mitigation**: Test thoroughly, have fallback plan to remove `dts.resolve` if needed
   - **Impact**: Types may remain as external imports (acceptable for internal package)

2. **Type resolution issues** - Some tools may not resolve types from source files correctly
   - **Mitigation**: Test with all consuming packages and tools (tsc, tsdown, IDE)
   - **Impact**: May need to keep build step if issues arise

3. **IDE support** - Some IDEs may have issues with source file type resolution
   - **Mitigation**: Test in common IDEs (VS Code, WebStorm)
   - **Impact**: May need IDE-specific configuration

### Trade-offs

1. **Bundling vs. No Build Step**:
   - If we remove `dts.resolve`, types won't be bundled but we eliminate the build step
   - This is acceptable because the internal types package is only used within the monorepo
   - External users don't depend on it, so bundling is less critical

2. **Simplicity vs. Compatibility**:
   - Pointing to source files is simpler but may have compatibility issues
   - We may need to keep the build step if compatibility issues arise
   - This is a technical debt item, so acceptable to try the simpler approach first

## Migration Plan

1. **Phase 1: Update package.json**
   - Change `types` field from `./dist/index.d.ts` to `./index.ts`
   - Update `exports.types` to point to source file
   - Remove `build` script (or make it optional)

2. **Phase 2: Test tsdown bundling**
   - Test if `dts.resolve` works with source files
   - If not, remove `dts.resolve` and test type resolution
   - Verify consuming packages still work correctly

3. **Phase 3: Update Turborepo**
   - Remove build dependency for internal types package
   - Ensure typecheck still works
   - Update any CI/CD workflows if needed

4. **Phase 4: Cleanup**
   - Remove `dist/` directory (or add to .gitignore if keeping for compatibility)
   - Remove build script from package.json
   - Update documentation

5. **Rollback plan**: If issues arise, revert to build step approach

## Open Questions

1. **Does tsdown's `dts.resolve` work with source `.ts` files?**
   - Need to test this during implementation
   - If not, we'll remove `dts.resolve` and rely on TypeScript's natural resolution

2. **Will IDE type resolution work correctly with source files?**
   - Need to test in VS Code and other common IDEs
   - May need IDE-specific configuration

3. **Do consuming packages need bundled types, or can they use external imports?**
   - For internal packages, external imports should be fine
   - Need to verify this doesn't cause issues

