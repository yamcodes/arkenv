# Design: ArkEnv Init CLI

The `@arkenv/cli` init command is designed as a minimalist, interactive wizard that guides users through setting up ArkEnv in an existing project.

## Goals / Non-Goals

**Goals:**
- Provide a zero-config interactive wizard for new ArkEnv projects.
- Support ArkType, Zod, and Valibot out of the box.
- Support Vite, Bun, and Node runtimes.
- Automate dependency installation and basic file generation.
- **Maintain zero runtime dependencies on the `arkenv` package** — the main library must remain entirely untouched.

**Non-Goals:**
- Add a runtime dependency to the user's project (beyond the normal `arkenv` packages).
- Provide a full project generator (it only scaffolds the `env.ts` and related config).
- Support JavaScript output in the initial version (TypeScript focus).

## Architecture: Standalone CLI Package

We adopt a strict separation of concerns to preserve `arkenv`'s zero-dependency status:

1. **`arkenv`** (main package) — Contains only the runtime parsing and validation code. It has zero dependencies, no CLI dependencies, and no `bin` scripts.
2. **`@arkenv/cli`** (new package) — Contains the full interactive CLI with `@clack/prompts`, `picocolors`, templates, and scaffolding logic. This package is **never installed** in the user's project — it is fetched on-demand via `npx`/`pnpm dlx`/`bunx`.

```text
User runs: pnpm dlx @arkenv/cli@latest init
                │
                ▼
        ┌───────────────┐
        │ @arkenv/cli   │  ← Heavy CLI (clack, picocolors, templates)
        │ (fetched via  │
        │  pnpm dlx)    │
        └───────────────┘
```

### Why This Pattern

- The `arkenv` package retains `"dependencies": {}` — **zero dependencies** on npm.
- No proxy scripts or complex "double-hop" executions are required.
- The interactive tooling (`@clack/prompts`, `picocolors`) never ends up in a user's project `node_modules`.

## Decisions

### 1. Package Structure

| Package | Location | Published As | Dependencies |
|---------|----------|-------------|-------------|
| `arkenv` | `packages/arkenv` | `arkenv` | `{}` (none) |
| `@arkenv/cli` | `packages/arkenv-cli` | `@arkenv/cli` | `@clack/prompts`, `picocolors` |

The `@arkenv/cli` package contains all the interactive CLI logic currently in `packages/arkenv/src/cli/`. The `arkenv` package does not expose any CLI commands.

### 2. Interactive Prompts with `@clack/prompts`

We use `@clack/prompts` for the interactive wizard. It provides a modern, "clack-y" UI (similar to Astro or T3-App) that feels premium and responsive.

### 3. Template Architecture

Templates are implemented as pure TypeScript functions that return content strings.
- **Rationale**: Simplifies bundling (no need to manage assets/fs copying of `.template` files) and allows for easy string interpolation based on user choices.
- **Location**: `packages/arkenv-cli/src/templates/`.

### 4. Build System

- **`@arkenv/cli`**: Uses the existing `tsdown` based build system. Config: `platform: "node"`, `format: ["cjs"]` (single format for CLI simplicity).

### 5. Package Manager Detection

The scaffolder determines the correct installation command by checking:
1. The `npm_config_user_agent` environment variable (most reliable for `dlx`/`npx` contexts).
2. The `packageManager` field in the target project's `package.json` (Corepack standard).
3. The presence of lockfiles: `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, or `package-lock.json`.
4. Defaulting to `npm` if no other signals are found.

## Risks / Trade-offs

- **[Trade-off]** Users must type `pnpm dlx @arkenv/cli@latest init` which is slightly longer. → **[Mitigation]** Document the command clearly. It is a standard pattern for CLI tools that are separated from their main libraries.
- **[Trade-off]** Template functions can become verbose. → **[Mitigation]** Keep templates focused and use standard helper functions for common snippets (e.g., imports).
