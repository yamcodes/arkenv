## Phase 1: Package Skeleton (completed — needs migration)

- [x] ~~1.1 Create CLI directory in `packages/arkenv/src/cli`~~ → will migrate to `packages/arkenv-cli`
- [x] ~~1.2 Add CLI dependencies to `arkenv/package.json`~~ → will move to `@arkenv/cli`
- [x] ~~1.3 Configure CLI build in `arkenv/tsdown.config.ts`~~ → will move to `@arkenv/cli`

## Phase 2: Core Implementation (completed — needs migration)

- [x] ~~2.1 Create `src/index.ts` with shebang and main orchestration logic~~
- [x] ~~2.2 Create `src/prompts.ts` using `@clack/prompts`~~
- [x] ~~2.3 Create `src/templates.ts` with template string functions~~
- [x] ~~2.4 Create `src/scaffold.ts` for file system operations~~
- [x] ~~2.5 Implement package manager detection logic~~

## Phase 3: Bootstrapper Migration 🏗️

- [ ] 3.1 Create `packages/arkenv-cli` package skeleton with `package.json` (`name: "@arkenv/cli"`) <!-- id: 30 -->
- [ ] 3.2 Move CLI source from `packages/arkenv/src/cli/` → `packages/arkenv-cli/src/` <!-- id: 31 -->
- [ ] 3.3 Move CLI dependencies (`@clack/prompts`, `picocolors`) from `arkenv` → `@arkenv/cli` <!-- id: 32 -->
- [ ] 3.4 Add `tsdown` build config for `@arkenv/cli` (platform: node, format: cjs, bundle all deps) <!-- id: 33 -->
- [ ] 3.5 Verify `@arkenv/cli` builds and runs standalone <!-- id: 34 -->

## Phase 4: Zero-Dep Proxy in `arkenv`

- [ ] 4.1 Create `packages/arkenv/bin/cli.cjs` — vanilla Node.js proxy script <!-- id: 40 -->
  - Reads own `package.json` version for version-locked spawning
  - Detects package runner via `npm_config_user_agent` (pnpm/npm/bun)
  - Spawns `@arkenv/cli@<version>` with `stdio: 'inherit'`
  - Forwards signals (`SIGINT`, `SIGTERM`) to child process
  - Exits with child's exit code
- [ ] 4.2 Update `arkenv/package.json` bin field to point to `bin/cli.cjs` <!-- id: 41 -->
- [ ] 4.3 Remove `@clack/prompts` and `picocolors` from `arkenv` dependencies <!-- id: 42 -->
- [ ] 4.4 Remove CLI entry from `arkenv/tsdown.config.ts` <!-- id: 43 -->
- [ ] 4.5 Verify `arkenv` has `"dependencies": {}` <!-- id: 44 -->

## Phase 5: Integration Testing

- [ ] 5.1 Run `pnpm install` to update workspace lockfile <!-- id: 50 -->
- [ ] 5.2 Verify `pnpm build --filter arkenv` produces no CLI bundle <!-- id: 51 -->
- [ ] 5.3 Verify `pnpm build --filter @arkenv/cli` builds successfully <!-- id: 52 -->
- [ ] 5.4 Smoke test: `node packages/arkenv/bin/cli.cjs init` correctly delegates to `@arkenv/cli` <!-- id: 53 -->
- [ ] 5.5 Add changesets for both `arkenv` (minor: remove CLI deps) and `@arkenv/cli` (minor: initial release) <!-- id: 54 -->

## Phase 6: Verification

- [ ] 6.1 Manual smoke test of the full flow in a temporary directory <!-- id: 60 -->
- [ ] 6.2 Verify generated `env.ts` files compile without errors <!-- id: 61 -->
- [ ] 6.3 Verify `arkenv` package size is reduced (no CLI deps in tarball) <!-- id: 62 -->
