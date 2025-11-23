## 1. Create Internal Types Package Structure
- [ ] 1.1 Create `packages/internal/types/` directory
- [ ] 1.2 Create `package.json` with workspace configuration (not published)
- [ ] 1.3 Create `tsconfig.json` with appropriate TypeScript configuration for type checking only
- [ ] 1.4 Create `index.ts` as the main entry point (no build needed, types-only)

## 2. Extract and Export Common Types
- [ ] 2.1 Create `infer-type.ts` with `InferType` type definition
- [ ] 2.2 Export `InferType` from `index.ts`
- [ ] 2.3 Add JSDoc comments documenting the type

## 3. Update Packages to Use Internal Types
- [ ] 3.1 Add `@repo/types` dependency to `packages/arkenv/package.json`
- [ ] 3.2 Update `packages/arkenv/src/create-env.ts` to import `InferType` from internal types
- [ ] 3.3 Add `@repo/types` dependency to `packages/vite-plugin/package.json`
- [ ] 3.4 Update `packages/vite-plugin/src/types.ts` to import `InferType` from internal types
- [ ] 3.5 Remove duplicate `InferType` definitions from both packages

## 4. Update Workflows
- [ ] 4.1 Review `.github/workflows/size-limit.yml` to ensure `packages/internal/**` is included (should be covered by `packages/**`)
- [ ] 4.2 Review `.github/workflows/pkg-pr-new.yml` to ensure internal package is excluded from publishing (should not be published)
- [ ] 4.3 Review `.github/workflows/test.yml` to ensure internal package is built and tested
- [ ] 4.4 Verify all workflows that reference `packages/**` properly handle `packages/internal/**`

## 5. Build and Test
- [ ] 5.1 Update Turborepo configuration if needed (no build task needed, types-only)
- [ ] 5.2 Run type checking to ensure imports work correctly
- [ ] 5.3 Run existing tests to ensure no regressions
- [ ] 5.4 Verify no bundle size impact (types-only, no runtime code)

## 6. Documentation
- [ ] 6.1 Add README.md to internal types package explaining its purpose
- [ ] 6.2 Document that this is an internal package (not published)

