## 1. Investigation and Testing
- [ ] 1.1 Test if tsdown's `dts.resolve` works with source `.ts` files (point package.json to `./index.ts` temporarily)
- [ ] 1.2 Test type resolution in consuming packages (arkenv, vite-plugin) with source files
- [ ] 1.3 Test IDE type resolution (VS Code, WebStorm) with source files
- [ ] 1.4 Document findings and decide on approach (keep dts.resolve vs. remove it)

## 2. Update Package Configuration
- [ ] 2.1 Update `packages/internal/types/package.json`:
  - Change `types` field from `./dist/index.d.ts` to `./index.ts`
  - Update `exports.types` to point to `./index.ts`
  - Remove or make optional the `build` script
- [ ] 2.2 Update `packages/internal/types/tsconfig.json` if needed (may not need declaration generation)
- [ ] 2.3 Update `packages/internal/types/README.md` to reflect no build step needed

## 3. Update tsdown Configuration
- [ ] 3.1 Test `dts.resolve` with source files in `packages/arkenv/tsdown.config.ts`
- [ ] 3.2 Test `dts.resolve` with source files in `packages/vite-plugin/tsdown.config.ts`
- [ ] 3.3 If `dts.resolve` doesn't work with source files:
  - Remove `dts.resolve: ["@repo/types"]` from both configs
  - Test that types still resolve correctly without bundling
  - Verify consuming packages build and work correctly

## 4. Update Turborepo Configuration
- [ ] 4.1 Review `turbo.json` for any build dependencies on internal types package
- [ ] 4.2 Remove build task requirement for `packages/internal/types` if present
- [ ] 4.3 Ensure `typecheck` task still works (should work with source files)
- [ ] 4.4 Test build pipeline to ensure no broken dependencies

## 5. Cleanup
- [ ] 5.1 Remove `dist/` directory from `packages/internal/types/` (or add to .gitignore)
- [ ] 5.2 Remove `build` script from `packages/internal/types/package.json` (or mark as optional)
- [ ] 5.3 Update any CI/CD workflows that reference internal types build
- [ ] 5.4 Verify `.gitignore` excludes `dist/` if we're not committing it

## 6. Testing and Validation
- [ ] 6.1 Run full test suite to ensure no regressions
- [ ] 6.2 Test type resolution in all consuming packages
- [ ] 6.3 Test IDE autocomplete and type checking
- [ ] 6.4 Verify bundle sizes are unchanged (types don't affect runtime bundle)
- [ ] 6.5 Test build pipeline end-to-end (clean build from scratch)

## 7. Documentation
- [ ] 7.1 Update `packages/internal/types/README.md` to document no build step needed
- [ ] 7.2 Update any architecture documentation that mentions internal types build
- [ ] 7.3 Document the decision and any trade-offs in design.md

