## Context

The `@arkenv/cli` currently generates `env.ts` and installs the necessary framework-specific plugin packages (e.g., `@arkenv/vite-plugin`). However, it stops short of actually configuring these plugins in the user's project configuration files (e.g., `vite.config.ts`), leaving a manual setup step.

## Goals / Non-Goals

**Goals:**
- Automatically inject plugin imports and registrations into Vite and Bun configuration files during the CLI scaffolding process.
- Fallback gracefully with clear manual instructions if the file is too complex to modify automatically.

**Non-Goals:**
- Handling highly dynamic or completely non-standard framework configuration files (e.g., configs generated at runtime).
- Rewriting the user's entire configuration file style (must preserve formatting as much as possible).

## Decisions

**Configuration Mutation Strategy**
*Decision*: Use a robust AST-based manipulation tool (like `magicast` or a similar lightweight equivalent) if available, falling back to targeted string replacement for standard template shapes. 
*Rationale*: String manipulation via Regex is fragile for TypeScript files that might have different styles of `export default` and `defineConfig`. However, avoiding large dependencies in the CLI is also a goal. We will try to parse standard scaffold outputs (which are predictable) and if we can't reliably parse it, we skip mutation and print the manual step.

## Risks / Trade-offs

- [Risk] Corrupting user's `vite.config.ts` or `bunfig.toml` -> *Mitigation*: Perform changes defensively. Only modify if we find the exact expected AST/string pattern for the plugins array. If unsure, do not touch the file.
