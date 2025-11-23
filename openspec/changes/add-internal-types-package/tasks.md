## 1. Create Internal Types Package Structure
- [ ] 1.1 Create `packages/internal-types/` directory
- [ ] 1.2 Create `package.json` with workspace configuration (not published)
- [ ] 1.3 Create `tsconfig.json` with appropriate TypeScript configuration
- [ ] 1.4 Create `tsdown.config.ts` for building the package
- [ ] 1.5 Create `src/index.ts` as the main entry point

## 2. Extract and Export Common Types
- [ ] 2.1 Create `src/infer-type.ts` with `InferType` type definition
- [ ] 2.2 Export `InferType` from `src/index.ts`
- [ ] 2.3 Add JSDoc comments documenting the type

## 3. Update Packages to Use Internal Types
- [ ] 3.1 Add `@arkenv/internal-types` dependency to `packages/arkenv/package.json`
- [ ] 3.2 Update `packages/arkenv/src/create-env.ts` to import `InferType` from internal types
- [ ] 3.3 Add `@arkenv/internal-types` dependency to `packages/vite-plugin/package.json`
- [ ] 3.4 Update `packages/vite-plugin/src/types.ts` to import `InferType` from internal types
- [ ] 3.5 Remove duplicate `InferType` definitions from both packages

## 4. Build and Test
- [ ] 4.1 Add build script to internal types package
- [ ] 4.2 Update Turborepo configuration if needed
- [ ] 4.3 Run type checking to ensure imports work correctly
- [ ] 4.4 Run existing tests to ensure no regressions
- [ ] 4.5 Verify bundle sizes remain within limits

## 5. Documentation
- [ ] 5.1 Add README.md to internal types package explaining its purpose
- [ ] 5.2 Document that this is an internal package (not published)

