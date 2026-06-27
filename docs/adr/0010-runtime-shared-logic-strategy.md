# Runtime Shared Logic Strategy

> **Originating RFC:** [Issue #1197 — Internal vs. Published Packages Strategy](https://github.com/yamcodes/arkenv/issues/1197)

## Context

ArkEnv relies on several internal utility functions and runtime configurations that must be shared across our core engine (`arkenv`) as well as framework plugins (e.g., `@arkenv/nextjs`, `@arkenv/nuxt`). This creates an architectural decision regarding how to distribute and share this logic effectively without compromising developer experience, type safety, or build environments.

When comparing code-sharing strategies, two traditional approaches are often cited:

1. **The NestJS Peer Dependency Model:** Extensive use of `peerDependencies` where heavy singletons are hoisted to the application root.
2. **The Published Utility Package:** Creating a public `@arkenv/utils` package published to npm that all other packages depend on.

Both of these standard approaches introduce critical flaws for ArkEnv's unique requirements as a structural typing utility.

## Decision

We will avoid peer dependencies for **runtime** code sharing and avoid publishing an external utility package for runtime logic.

Instead, we will adopt an **Inlined Internal Packages Strategy** (`@repo/*`) combined with **Subpath Exports** for sharing runtime logic.

We distinguish between two categories of shared logic:

### Runtime Shared Logic

Runtime logic must remain 100% dependency-free and must not suffer from version or singleton skew.

1. **Stateless Logic (Helpers/Parsers):** Shared stateless logic will live in an internal monorepo package (e.g., `@repo/utils`). Using our bundler (`tsdown`), this logic will be physically inlined into the distributables of the consuming published packages (`arkenv`, `@arkenv/core`).
2. **Stateful Logic (Singletons/Schemas):** Any stateful logic or singleton configuration will be managed via Subpath Exports directly from the core `arkenv` package, rather than using peer dependencies to enforce a single instance. The core package exposes named entry points such as `arkenv/standard` and `arkenv/core` via its `exports` field. Future stateful internals (e.g., shared ArkType scopes) may be exposed through additional subpaths like `arkenv/internal` if needed.

### Build-Time Shared Logic

Build-time logic is Node-only and does not impact the runtime footprint. This includes AST parsing, file-watching, and codegen utilities.

Build-time shared logic is centralized in the published `@arkenv/build` package (see [ADR 0009: Shared Build Package](./0009-shared-build-package.md)). Framework plugins list `@arkenv/build` as a regular dependency. Because it is consumed only during development and build phases, it does not compromise Edge runtime compatibility.

## Rationale

### 1. Why Not The NestJS Peer Dependency Model?

NestJS is a heavy, opinionated framework. It extensively uses `peerDependencies` (e.g., `@nestjs/core`, `@nestjs/common`) and relies on the user's package manager (npm/pnpm/yarn) to hoist these dependencies to the root of the project, theoretically ensuring a single instance of the framework's IoC container across the app.

This works for NestJS because users expect a rigid, complex dependency graph within a tightly controlled application boundary.

However, this is fundamentally incompatible with ArkEnv for several reasons:

- **Version Skew and Phantom Dependencies:** Monorepo package managers notoriously struggle with strict peer dependency hoisting. If a user installs a slightly different version of a sub-package, the package manager may duplicate the dependency in `node_modules`.
- **Fatal for Structural Typing:** ArkEnv relies heavily on ArkType, which evaluates schemas using structural typing, `instanceof` checks, and strict object identity under the hood. If a duplicated instance of the core engine or ArkType is loaded due to peer dependency failure, schema evaluation and type scoping break silently at runtime. We cannot afford to trust hoisting for singleton integrity.

### 2. Why Not a Published `@arkenv/utils` Package?

The standard alternative to peer dependencies is a centralized utility package. We could create an `@arkenv/utils` package and publish it to npm, having `arkenv` and framework plugins depend on it normally.

This introduces unacceptable friction:

- **Public API Surface Bloat:** We would be forced to publish purely internal implementation details to npm.
- **Dependency Graph Bloat:** Users must download additional packages, slowing down install times and increasing the overall node_modules footprint.
- **Cascading Version Bumps:** Updating a single internal helper function would require bumping `@arkenv/utils`, which then requires bumping `arkenv` and all framework plugins, turning minor internal refactors into massive versioning chores.

### 3. The Power of Inlined Internal Packages

By keeping `@repo/utils` purely as a local workspace package, we achieve the best of both worlds:

- **Zero Distribution Cost:** Using `tsdown`, we inline the specific functions we need directly into the published bundles. At runtime, the user downloads zero external utility packages. The logic is fully self-contained.
- **Excellent Monorepo DX:** We maintain the developer experience of sharing typed code across our monorepo during development.
- **Build Tool Stability:** Inlined code avoids the issue where "build tools crash on Edge runtimes." If we used external packages that inadvertently pulled in Node-native modules (like `fs` or `path`), Edge deployment platforms (like Vercel) would crash. Inlining allows us to strictly control the exact code entering the runtime payload.

### 4. Separation of Build-Time Concerns

By routing build-time shared logic through `@arkenv/build` (a published but internal-only package), we:

- Keep the core `arkenv` runtime 100% dependency-free and Edge-compatible.
- Avoid duplicating AST parsers, file watchers, and codegen logic across framework plugins.
- Allow build utilities to depend on Node-native modules (`fs`, `path`, `chokidar`) without risking runtime crashes.

## Consequences

- **Positive:** No version skew or runtime duplication risks for core logic.
- **Positive:** Faster user installs with fewer runtime packages.
- **Positive:** Reduced version bump cascading for internal runtime helpers.
- **Positive:** Clean separation between runtime and build-time concerns.
- **Negative:** The compiled bundle size of the core packages might be trivially larger due to inlined helpers, but this is mitigated by tree-shaking and the lightweight nature of the utilities.
