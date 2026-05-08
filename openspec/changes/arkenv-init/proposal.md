## Why

Currently, setting up ArkEnv requires manual configuration and copying patterns from examples. As the project expands to support multiple validators (ArkType, Zod, Valibot) and runtimes (Vite, Bun, Node), a standardized scaffolding tool is needed to ensure users can get started with a "best practices" setup in under a minute via `arkenv init`.

Additionally, the current implementation bundles CLI dependencies (`@clack/prompts`, `picocolors`) as **runtime dependencies** of the `arkenv` package. This pollutes the user's `node_modules` and undermines the "Zero Dependencies" positioning that is critical for a library package.

## What Changes

- **Extract CLI into `@arkenv/cli`**: Move all interactive CLI logic (prompts, templates, scaffolding) from `packages/arkenv/src/cli/` into a new `packages/arkenv-cli` package published as `@arkenv/cli`.
- **Add a zero-dependency proxy**: Replace the current CLI bin entry in `arkenv` with a ~30-line vanilla Node.js script that dynamically spawns `@arkenv/cli` via the user's package runner.
- **Remove CLI deps from `arkenv`**: Delete `@clack/prompts` and `picocolors` from `arkenv`'s `dependencies`, restoring `"dependencies": {}`.

## Architecture

We adopt the **"Bootstrapper" pattern** — two packages under the hood, but the user still runs `pnpm dlx arkenv@latest init`:

1. `arkenv` — zero-dep proxy that routes `init` to `@arkenv/cli@<same-version>`
2. `@arkenv/cli` — the full interactive CLI with all UI tooling

## Capabilities

### New Capabilities
- `scaffolding-cli`: An interactive wizard that scaffolds a working ArkEnv setup based on user preferences.
- `cli-proxy`: A lightweight bootstrapper in `arkenv` that delegates CLI commands to `@arkenv/cli`.

### Modified Capabilities
- `arkenv` package: Restored to zero runtime dependencies.

## Impact

- **New Package**: `packages/arkenv-cli` added to the monorepo, published as `@arkenv/cli`.
- **Modified Package**: `arkenv` loses its CLI dependencies; gains a tiny proxy bin script.
- **CLI Ecosystem**: Establishes the pattern for future ArkEnv CLI subcommands (e.g., `arkenv check`, `arkenv lint`).
- **Dependencies**: `@clack/prompts` and `picocolors` move from `arkenv` → `@arkenv/cli`.
- **DX**: Unchanged — `pnpm dlx arkenv@latest init` still works identically.
