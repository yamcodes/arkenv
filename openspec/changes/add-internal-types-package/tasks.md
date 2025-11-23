## 1. Create Internal Types Package Structure
- [x] 1.1 Create `packages/internal/types/` directory
- [x] 1.2 Create `package.json` with workspace configuration (not published)
- [x] 1.3 Create `tsconfig.json` with appropriate TypeScript configuration for type checking only
- [x] 1.4 Create `index.ts` as the main entry point (no build needed, types-only)

## 2. Extract and Export Common Types
- [x] 2.1 Create `infer-type.ts` with `InferType` type definition
- [x] 2.2 Export `InferType` from `index.ts`
- [x] 2.3 Add JSDoc comments documenting the type

## 3. Update Packages to Use Internal Types
- [x] 3.1 Add `@repo/types` dependency to `packages/arkenv/package.json`
- [x] 3.2 Update `packages/arkenv/src/create-env.ts` to import `InferType` from internal types
- [x] 3.3 Add `@repo/types` dependency to `packages/vite-plugin/package.json`
- [x] 3.4 Update `packages/vite-plugin/src/types.ts` to import `InferType` from internal types
- [x] 3.5 Remove duplicate `InferType` definitions from both packages

## 4. Update Workflows
- [x] 4.1 Review `.github/workflows/size-limit.yml` to ensure `packages/internal/**` is included (should be covered by `packages/**`)
- [x] 4.2 Review `.github/workflows/pkg-pr-new.yml` to ensure internal package is excluded from publishing (should not be published)
- [x] 4.3 Review `.github/workflows/test.yml` to ensure internal package is built and tested
- [x] 4.4 Verify all workflows that reference `packages/**` properly handle `packages/internal/**`
- [x] 4.5 Add `@repo/types` to `.changeset/config.json` ignore list
- [x] 4.6 Add `packages/internal/*` to `pnpm-workspace.yaml`

## 5. Build and Test
- [x] 5.1 Update Turborepo configuration if needed (no build task needed, types-only)
- [x] 5.2 Run type checking to ensure imports work correctly
- [x] 5.3 Run existing tests to ensure no regressions
- [x] 5.4 Verify no bundle size impact (types-only, no runtime code)

## 6. Documentation
- [x] 6.1 Add README.md to internal types package explaining its purpose
- [x] 6.2 Document that this is an internal package (not published)

