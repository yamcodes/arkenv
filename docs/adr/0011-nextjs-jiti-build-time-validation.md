# Next.js Build-Time Validation via Jiti

To define the architecture for executing build-time environment variable validation in `@arkenv/nextjs` using `jiti`, balancing backwards compatibility, ease of use (developer experience), and cleaner codebase design.

## Context & problem

During the Next.js boot sequence (when evaluating `next.config.js`), the Node.js runtime has not yet loaded Next.js's internal bundler or transpilers. This raw Node.js environment cannot natively parse or execute TypeScript files. Importing a TypeScript schema definition file (`env.ts`) directly into a JS/MJS config file results in a runtime crash.

In Next.js 15+, native support for `next.config.ts` was introduced. Under the hood, Next.js itself handles transpiling the configuration and any of its top-level TypeScript imports (e.g. `import "./src/env"`). This makes manual dynamic transpilation loaders unnecessary for Next.js 15+ apps using `.ts` configuration.

However, `@arkenv/nextjs` aims to support a wide range of Next.js versions (including Next.js 13 and 14) and different configuration extensions (`.js`, `.mjs`, `.ts`).

We evaluated two architectural paths to support build-time schema evaluation:

- **Option 1: Dependency-free validation, forcing Next.js 15+ and `next.config.ts`**
  Remove `jiti` entirely. Require the user to migrate to Next.js 15+ and `next.config.ts`, and instruct them to manually write a top-level import (`import "./src/env"`) at the top of their Next.js configuration to trigger validation at build time.
- **Option 2: Internal dynamic transpilation via `jiti` in `withArkEnv` wrapper (Chosen)**
  Keep the `withArkEnv` wrapper. Bundle `jiti` (a lightweight, widely-adopted, best-in-class TypeScript runtime execution tool) as a development dependency in `@arkenv/nextjs`. The wrapper automatically spins up a `jiti` instance to parse and validate `env.ts` during initialization.

## Decision

We adopt **Option 2** (internal transpilation via `jiti`) for `@arkenv/nextjs`.

1. **Negligible Cost:** `jiti` is small (\~40kb minified), extremely robust, and is only loaded once at startup/build time. It has zero runtime performance impact on production user traffic.
2. **Backwards Compatibility:** We maintain seamless support for Next.js 13 & 14, which comprise a significant portion of active Next.js installations.
3. **Config Extension Agnostic:** It allows users using `next.config.js` or `next.config.mjs` to still have their `env.ts` validated automatically, without forcing them to rename their configuration file to `.ts` or write manual import/require wrappers.
4. **Preserved Zero-Config DX:** The developer experience is a clean `withArkEnv(nextConfig)` wrapper, rather than shifting the setup burden to the developer's configuration files (unlike `@t3-oss/env-nextjs` which historically required manual user-land `jiti` setups or configuration imports).
5. **Pure Workspace Tests (Dependency Injection):** To prevent the "dual package hazard" in workspace monorepo testing (where `jiti` resolving built/unbuilt workspaces conflicts with Vitest's ESM resolutions), we expose an internal `_jitiAliases` configuration option. Monorepo-specific path mapping is dynamically injected from test files, keeping production source code free of test-runner logic (e.g. `process.env.VITEST` checking).

## Consequences

- **Robust DX:** Developers get automatic build-time validation out-of-the-box by wrapping their config. They do not need to manually configure loaders or install custom tools.
- **Broad Compatibility:** Support spans Next.js versions 13 through 15+ and configuration formats `.js`, `.mjs`, and `.ts`.
- **Zero-Dependency Core runtime:** While `@arkenv/nextjs` utilizes `jiti` during build/setup, the core `arkenv` package itself remains completely dependency-free.
- **No Code Pollution:** Production code remains pure and agnostic of test environments, while tests safely isolate monorepo workspace configurations.
