## 1. Package Skeleton

- [x] 1.1 Create CLI directory in `packages/arkenv/src/cli`
- [x] 1.2 Add CLI dependencies to `arkenv/package.json`
- [x] 1.3 Configure CLI build in `arkenv/tsdown.config.ts`

## 2. Core Implementation: ArkEnv Init CLI

- [x] 2.1 Create `src/index.ts` with shebang and main orchestration logic
- [x] 2.2 Create `src/prompts.ts` using `@clack/prompts` for the interactive wizard
- [x] 2.3 Create `src/templates.ts` with template string functions for all combinations
- [x] 2.4 Create `src/scaffold.ts` for file system operations and dependency installation
- [x] 2.5 Implement package manager detection logic in `src/scaffold.ts`

## 3. Integration and Polishing

- [x] 3.1 Run `pnpm install` to update workspace lockfile
- [x] 3.2 Verify `pnpm build --filter arkenv` works correctly
- [x] 3.3 Add a changeset for the new `arkenv-init` CLI

## 4. Verification

- [x] 4.1 Perform a manual smoke test by running the built CLI in a temporary directory
- [x] 4.2 Verify generated `env.ts` files compile without errors

## Phase 4: Migration to `arkenv` Package 🏗️
- [x] Move CLI source code to `packages/arkenv/src/cli` <!-- id: 16 -->
- [x] Add CLI dependencies to `packages/arkenv` <!-- id: 17 -->
- [x] Update `arkenv/tsdown.config.ts` to bundle the CLI entry point <!-- id: 18 -->
- [x] Add `bin` field to `packages/arkenv/package.json` <!-- id: 19 -->
- [x] Implement `init` command handling in `src/cli/index.ts` <!-- id: 20 -->
- [x] Remove `packages/create-arkenv` after successful migration <!-- id: 21 -->
