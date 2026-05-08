## Why

Currently, setting up ArkEnv requires manual configuration and copying patterns from examples. As the project expands to support multiple validators (ArkType, Zod, Valibot) and runtimes (Vite, Bun, Node), a standardized scaffolding tool is needed to ensure users can get started with a "best practices" setup in under a minute via an init script.

Additionally, the current implementation bundles CLI dependencies (`@clack/prompts`, `picocolors`) as **runtime dependencies** of the `arkenv` package. This pollutes the user's `node_modules` and undermines the "Zero Dependencies" positioning that is critical for a library package.

## What Changes

- **Extract CLI into `@arkenv/cli`**: Move all interactive CLI logic (prompts, templates, scaffolding) from `packages/arkenv/src/cli/` into a new `packages/arkenv-cli` package published as `@arkenv/cli`.
- **Remove CLI deps from `arkenv`**: Delete `@clack/prompts` and `picocolors` from `arkenv`'s `dependencies`, restoring `"dependencies": {}`. Remove the `bin` configuration from `arkenv`.

## Architecture

We adopt a strict separation of packages:

1. `arkenv` — the core library, remains untouched with zero dependencies.
2. `@arkenv/cli` — the full interactive CLI with all UI tooling.

Users will run the CLI via: `pnpm dlx @arkenv/cli@latest init`

## Capabilities

### New Capabilities
- `scaffolding-cli`: An interactive wizard that scaffolds a working ArkEnv setup based on user preferences, distributed via `@arkenv/cli`.

### Modified Capabilities
- `arkenv` package: Restored to zero runtime dependencies and no CLI surface.

## Impact

- **New Package**: `packages/arkenv-cli` added to the monorepo, published as `@arkenv/cli`.
- **Modified Package**: `arkenv` loses its CLI dependencies and `bin` entry.
- **CLI Ecosystem**: Establishes the pattern for future ArkEnv CLI subcommands (e.g., `check`, `lint`) via `@arkenv/cli`.
- **Dependencies**: `@clack/prompts` and `picocolors` move from `arkenv` → `@arkenv/cli`.
- **DX**: Users invoke the CLI via `pnpm dlx @arkenv/cli@latest init`.
