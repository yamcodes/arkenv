## 1. Package Skeleton

- [x] 1.1 Create `packages/create-arkenv/` directory
- [x] 1.2 Create `package.json` with `@clack/prompts`, `tsdown`, and standard scripts
- [x] 1.3 Copy and adapt `tsconfig.json` from `packages/vite-plugin`
- [x] 1.4 Create `tsdown.config.ts` with `platform: \"node\"` and dual format output
- [x] 1.5 Create `vitest.config.ts` by copying from existing packages

## 2. Core Implementation

- [x] 2.1 Create `src/index.ts` with shebang and main orchestration logic
- [x] 2.2 Create `src/prompts.ts` using `@clack/prompts` for the interactive wizard
- [x] 2.3 Create `src/templates.ts` with template string functions for all combinations
- [x] 2.4 Create `src/scaffold.ts` for file system operations and dependency installation
- [x] 2.5 Implement package manager detection logic in `src/scaffold.ts`

## 3. Integration and Polishing

- [x] 3.1 Run `pnpm install` to update workspace lockfile
- [x] 3.2 Verify `pnpm build --filter create-arkenv` works correctly
- [x] 3.3 Add a changeset for the new `create-arkenv` package

## 4. Verification

- [x] 4.1 Perform a manual smoke test by running the built CLI in a temporary directory
- [x] 4.2 Verify generated `env.ts` files compile without errors
