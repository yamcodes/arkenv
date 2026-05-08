## 1. Package Skeleton

- [ ] 1.1 Create `packages/create-arkenv/` directory
- [ ] 1.2 Create `package.json` with `@clack/prompts`, `tsdown`, and standard scripts
- [ ] 1.3 Copy and adapt `tsconfig.json` from `packages/vite-plugin`
- [ ] 1.4 Create `tsdown.config.ts` with `platform: "node"` and dual format output
- [ ] 1.5 Create `vitest.config.ts` by copying from existing packages

## 2. Core Implementation

- [ ] 2.1 Create `src/index.ts` with shebang and main orchestration logic
- [ ] 2.2 Create `src/prompts.ts` using `@clack/prompts` for the interactive wizard
- [ ] 2.3 Create `src/templates.ts` with template string functions for all combinations
- [ ] 2.4 Create `src/scaffold.ts` for file system operations and dependency installation
- [ ] 2.5 Implement package manager detection logic in `src/scaffold.ts`

## 3. Integration and Polishing

- [ ] 3.1 Run `pnpm install` to update workspace lockfile
- [ ] 3.2 Verify `pnpm build --filter create-arkenv` works correctly
- [ ] 3.3 Add a changeset for the new `create-arkenv` package

## 4. Verification

- [ ] 4.1 Perform a manual smoke test by running the built CLI in a temporary directory
- [ ] 4.2 Verify generated `env.ts` files compile without errors
