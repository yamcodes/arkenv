# AGENTS.md

## Cursor Cloud specific instructions

ArkEnv is a pnpm + Turborepo monorepo for a TypeScript env-var validation library. There are no databases or external services; the only long-running process is the `www` docs site (Next.js). Standard commands live in `package.json`, `docs/CONTRIBUTING.md`, and `docs/TESTING.md` — prefer those.

> This is the `v1` branch. Its package layout differs from `dev` (v0): here `packages/arkenv` is the **CLI** (published as `arkenv`) and the **core runtime** lives in `packages/core` (published as `@arkenv/core`). There is no `packages/cli` on `v1`. `v1` publishes pre-release versions (`1.0.0-alpha.x`) under the `next` npm tag.

### Services / apps

- `packages/*` — the publishable library packages: `arkenv` (the CLI, in `packages/arkenv/`), `@arkenv/core` (core runtime, in `packages/core/`), `@arkenv/standard` (in `packages/standard/`), plus `@arkenv/nextjs`, `@arkenv/nuxt`, `@arkenv/vite-plugin`, `@arkenv/bun-plugin`, `@arkenv/build`, and `@arkenv/fumadocs-ui` (which live in the `nextjs/`, `nuxt/`, `vite-plugin/`, `bun-plugin/`, `build/`, and `fumadocs-ui/` directories), plus internal helpers under `packages/internal/*`. These are the core product.
- `apps/www` — the documentation website (Next.js 16 + Fumadocs). This is the only runnable app.
- `apps/playwright-www` — Playwright e2e suite targeting `www`.
- `apps/playgrounds/*` and `examples/*` — framework sandboxes / fixtures (optional).

### Common commands (run from repo root)

- Build everything: `pnpm build` · packages only: `pnpm build:packages`
- Run docs site (dev): `pnpm www` (serves on `http://localhost:3000`)
- Lint/format + workspace validation: `pnpm check`
- Typecheck: `pnpm typecheck`
- Unit/integration tests: `pnpm test -- --run` (Vitest)
- E2E: see caveat below.

### Non-obvious caveats

- Bun is required for `@arkenv/bun-plugin` and some bun playground/example flows, and CI installs Bun 1.3.13. It is installed globally at `~/.bun/bin` (on `PATH` via `~/.bashrc` for login shells); if a session's shell can't find `bun`, run `export PATH="$HOME/.bun/bin:$PATH"`. Bun is not needed for the core build / `pnpm test` / running `www`.
- Node 22 (current VM LTS) works for build/lint/test/run. Some `examples/*` and playgrounds declare `"engines": { "node": "24" }`, which only produces a harmless `Unsupported engine` warning under Node 22. CI runs the typecheck job on Node 24.
- E2E must be run the CI way (against a production server), not against `pnpm www`. The Playwright config uses `next start` when `CI` is set and `next dev` otherwise; the dev server emits console errors that the smoke test forbids and can be overwhelmed by parallel workers (`ERR_CONNECTION_REFUSED`). Build `www` first (`pnpm build --filter=www...`), then run e.g. `CI=1 pnpm exec playwright test --project=chromium` from `apps/playwright-www`. Playwright browsers must be installed once per VM: `pnpm exec playwright install --with-deps chromium firefox` (webkit is macOS-only).
- The CLI tests print `fatal: not a git repository` / `Using 'master' as the name...` git hints while running — this is expected (they scaffold temp git repos) and does not indicate failure.
- To run a package that consumes the local (workspace) build, use a workspace playground (e.g. `apps/playgrounds/node`, which depends on `@arkenv/core: workspace:*`). Copy `.env.example` to `.env` first, then `pnpm start`. The `examples/*` projects are standalone npm projects that resolve the published packages (e.g. `@arkenv/core`) from npm, not the local build.
