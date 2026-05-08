# Design: ArkEnv Init CLI

The `arkenv init` CLI is designed as a minimalist, interactive wizard that guides users through setting up ArkEnv in an existing project.

## Goals / Non-Goals

**Goals:**
- Provide a zero-config interactive wizard for new ArkEnv projects.
- Support ArkType, Zod, and Valibot out of the box.
- Support Vite, Bun, and Node runtimes.
- Automate dependency installation and basic file generation.

**Non-Goals:**
- Add a runtime dependency to the user's project (beyond the normal `arkenv` packages).
- Provide a full project generator (it only scaffolds the `env.ts` and related config).
- Support JavaScript output in the initial version (TypeScript focus).

## Decisions

### 1. Package Naming and Bin
The CLI is integrated into the main `arkenv` package. This allows users to run `pnpm dlx arkenv@latest init` to set up ArkEnv in their project. The binary is output as `cli.cjs` to ensure compatibility.

### 2. Interactive Prompts with `@clack/prompts`
We will use `@clack/prompts` for the interactive wizard. It provides a modern, "clack-y" UI (similar to Astro or T3-App) that feels premium and responsive.

### 3. Template Architecture
Templates will be implemented as pure TypeScript functions that return content strings.
- **Rationale**: Simplifies bundling (no need to manage assets/fs copying of `.template` files) and allows for easy string interpolation based on user choices.
- **Location**: `src/templates.ts`.

### 4. Build System
We will use the existing `tsdown` based build system used in other packages (e.g., `vite-plugin`).
- **Config**: `platform: "node"`, `format: ["esm", "cjs"]`.

### 5. Package Manager Detection
The scaffolder will determine the correct installation command by checking:
1. The `packageManager` field in the target project's `package.json` (Corepack standard).
2. The presence of lockfiles: `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, or `package-lock.json`.
3. Defaulting to `npm` if no other signals are found.

## Risks / Trade-offs

- **[Risk]** Complexity in dual-format (ESM/CJS) bundling for a CLI. → **[Mitigation]** Use the established `tsdown` pattern from `vite-plugin` and verify the `.cjs` entry point in the `bin` field.
- **[Trade-off]** Template functions can become verbose. → **[Mitigation]** Keep templates focused and use standard helper functions for common snippets (e.g., imports).
