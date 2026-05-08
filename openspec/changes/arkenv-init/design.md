# Design: ArkEnv Init CLI

The `arkenv init` CLI is designed as a minimalist, interactive wizard that guides users through setting up ArkEnv in an existing project.

## Goals / Non-Goals

**Goals:**
- Provide a zero-config interactive wizard for new ArkEnv projects.
- Support ArkType, Zod, and Valibot out of the box.
- Support Vite, Bun, and Node runtimes.
- Automate dependency installation and basic file generation.
- **Maintain zero runtime dependencies on the `arkenv` package** — the CLI must not pollute the user's `node_modules`.

**Non-Goals:**
- Add a runtime dependency to the user's project (beyond the normal `arkenv` packages).
- Provide a full project generator (it only scaffolds the `env.ts` and related config).
- Support JavaScript output in the initial version (TypeScript focus).

## Architecture: The "Bootstrapper" Pattern

We adopt a **two-package architecture** to preserve `arkenv`'s zero-dependency status while providing a rich CLI experience.

### How It Works

1. **`arkenv`** (main package) — Contains a tiny, zero-dependency `bin` script that acts as a router. When a user runs `pnpm dlx arkenv@latest init`, this script intercepts the `init` command and dynamically spawns the heavy CLI from `@arkenv/cli`.
2. **`@arkenv/cli`** (new package) — Contains the full interactive CLI with `@clack/prompts`, `picocolors`, templates, and scaffolding logic. This package is **never installed** in the user's project — it is fetched on-demand via `npx`/`pnpm dlx`/`bunx`.

```
User runs: pnpm dlx arkenv@latest init
                │
                ▼
        ┌───────────────┐
        │  arkenv/bin/   │  ← Zero-dep proxy script (~20 lines)
        │  cli.js        │
        └───────┬───────┘
                │ spawnSync('@arkenv/cli@<version>', ['init', ...args])
                ▼
        ┌───────────────┐
        │ @arkenv/cli   │  ← Heavy CLI (clack, picocolors, templates)
        │ (fetched via  │
        │  npx/dlx)     │
        └───────────────┘
```

### Why This Pattern

- The `arkenv` package retains `"dependencies": {}` — **zero dependencies** on npm.
- The CLI UX is identical: `pnpm dlx arkenv@latest init` just works.
- The interactive tooling (`@clack/prompts`, `picocolors`) never ends up in a user's project `node_modules`.

## Decisions

### 1. Package Structure

| Package | Location | Published As | Dependencies |
|---------|----------|-------------|-------------|
| `arkenv` | `packages/arkenv` | `arkenv` | `{}` (none) |
| `@arkenv/cli` | `packages/arkenv-cli` | `@arkenv/cli` | `@clack/prompts`, `picocolors` |

The `arkenv` package gets a `bin` entry pointing to a lightweight proxy script. The `@arkenv/cli` package contains all the interactive CLI logic currently in `packages/arkenv/src/cli/`.

### 2. Version-Locked Spawning

The proxy script reads its own `package.json` version and spawns the CLI at the **same version**, avoiding the "@latest trap" where mismatched versions could cause breakage:

```js
const version = require('../package.json').version;
spawnSync('npx', ['--yes', `@arkenv/cli@${version}`, ...args], { ... });
```

### 3. Package Manager-Aware Delegation

The proxy detects how it was invoked and uses the matching package runner for the sub-call:

- If invoked via `pnpm dlx` → use `pnpm dlx` for the sub-call (faster caching)
- If invoked via `bunx` → use `bunx`
- Default → `npx --yes`

Detection is done via the `npm_config_user_agent` environment variable or process ancestry.

### 4. Interactive Prompts with `@clack/prompts`

We use `@clack/prompts` for the interactive wizard. It provides a modern, "clack-y" UI (similar to Astro or T3-App) that feels premium and responsive.

### 5. Template Architecture

Templates are implemented as pure TypeScript functions that return content strings.
- **Rationale**: Simplifies bundling (no need to manage assets/fs copying of `.template` files) and allows for easy string interpolation based on user choices.
- **Location**: `packages/arkenv-cli/src/templates/`.

### 6. Build System

- **`@arkenv/cli`**: Uses the existing `tsdown` based build system. Config: `platform: "node"`, `format: ["cjs"]` (single format for CLI simplicity).
- **`arkenv` proxy**: A vanilla `.cjs` script — no build step needed. Committed directly as `bin/cli.cjs`.

### 7. Package Manager Detection

The scaffolder determines the correct installation command by checking:
1. The `npm_config_user_agent` environment variable (most reliable for `dlx`/`npx` contexts).
2. The `packageManager` field in the target project's `package.json` (Corepack standard).
3. The presence of lockfiles: `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, or `package-lock.json`.
4. Defaulting to `npm` if no other signals are found.

## Tradeoff Mitigations

### Double-Hop Latency
The second download adds ~2-3s on a fast connection. Mitigations:
- Use the same package runner (pnpm/npm/bun) for the sub-call to leverage existing cache.
- `@arkenv/cli` is kept small (clack + picocolors are tiny).
- Once cached, subsequent runs are instant.

### Signal Propagation
The proxy must properly handle `Ctrl+C` and other signals to avoid zombie processes or broken terminal state:
- Use `stdio: 'inherit'` for full terminal passthrough.
- Forward `SIGINT` and `SIGTERM` to the child process.
- Ensure the proxy exits with the child's exit code.

### Offline Usage
If `@arkenv/cli` is not cached and the user is offline, `arkenv init` will fail. This is acceptable because:
- `arkenv init` is a one-shot onboarding tool, not a runtime dependency.
- Users running it for the first time inherently need network access (to install packages anyway).

### Permission & Environment Assumptions
The proxy assumes `npx`/`pnpm dlx`/`bunx` is available. This is safe because:
- The user already ran `pnpm dlx arkenv` or `npx arkenv`, proving the runner works.
- We reuse the same runner for the sub-call.

## Risks / Trade-offs

- **[Risk]** Managing two packages increases publish complexity. → **[Mitigation]** Publish in tandem with version-locked releases via changesets. Both packages are in the same monorepo.
- **[Risk]** Double-hop latency on first run. → **[Mitigation]** Reuse the same package runner; tiny CLI package size.
- **[Trade-off]** Template functions can become verbose. → **[Mitigation]** Keep templates focused and use standard helper functions for common snippets (e.g., imports).
- **[Trade-off]** The proxy script adds a thin layer of indirection. → **[Mitigation]** The script is ~30 lines of vanilla Node.js — trivial to maintain and debug.
