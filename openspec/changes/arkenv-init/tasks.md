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

## Phase 3: Standalone CLI Package Migration 🏗️

- [ ] 3.1 Create `packages/arkenv-cli` package skeleton with `package.json` (`name: "@arkenv/cli"`) <!-- id: 30 -->
- [ ] 3.2 Move CLI source from `packages/arkenv/src/cli/` → `packages/arkenv-cli/src/` <!-- id: 31 -->
- [ ] 3.3 Move CLI dependencies (`@clack/prompts`, `picocolors`) from `arkenv` → `@arkenv/cli` <!-- id: 32 -->
- [ ] 3.4 Add `tsdown` build config for `@arkenv/cli` (platform: node, format: cjs, bundle all deps) <!-- id: 33 -->
- [ ] 3.5 Configure `bin` field in `@arkenv/cli/package.json` <!-- id: 35 -->
- [ ] 3.6 Remove `@clack/prompts` and `picocolors` from `arkenv` dependencies <!-- id: 36 -->
- [ ] 3.7 Remove `bin` field and CLI entry from `arkenv/package.json` and `tsdown.config.ts` <!-- id: 37 -->
- [ ] 3.8 Verify `arkenv` has `"dependencies": {}` <!-- id: 38 -->

## Phase 4: Integration Testing

- [ ] 4.1 Run `pnpm install` to update workspace lockfile <!-- id: 50 -->
- [ ] 4.2 Verify `pnpm build --filter arkenv` produces no CLI bundle <!-- id: 51 -->
- [ ] 4.3 Verify `pnpm build --filter @arkenv/cli` builds successfully <!-- id: 52 -->
- [ ] 4.4 Smoke test: `pnpm --filter @arkenv/cli run start` correctly runs the interactive wizard <!-- id: 53 -->
- [ ] 4.5 Add changesets for both `arkenv` (minor: remove CLI deps) and `@arkenv/cli` (minor: initial release) <!-- id: 54 -->

## Phase 5: Verification

- [ ] 5.1 Manual smoke test of the full flow in a temporary directory <!-- id: 60 -->
- [ ] 5.2 Verify generated `env.ts` files compile without errors <!-- id: 61 -->
- [ ] 5.3 Verify `arkenv` package size is reduced (no CLI deps in tarball) <!-- id: 62 -->
