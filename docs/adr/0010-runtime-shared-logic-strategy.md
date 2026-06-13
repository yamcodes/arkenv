# Runtime Shared Logic Strategy

## Context

Arkenv relies on several internal utility functions and runtime configurations that must be shared across our core engines (`@arkenv/core` and `@arkenv/standard`) as well as framework plugins (e.g., `@arkenv/nextjs`, `@arkenv/nuxt`). This creates an architectural decision regarding how to distribute and share this logic effectively without compromising developer experience, type safety, or build environments.

When comparing code-sharing strategies, two traditional approaches are often cited:
1. **The NestJS Peer Dependency Model:** Extensive use of `peerDependencies` where heavy singletons are hoisted to the application root.
2. **The Published Utility Package:** Creating a public `@arkenv/utils` package published to npm that all other packages depend on.

Both of these standard approaches introduce critical flaws for Arkenv's unique requirements as a structural typing utility.

## Decision

We will avoid peer dependencies for code sharing and avoid publishing an external utility package. 

Instead, we will adopt an **Inlined Internal Packages Strategy** (`@repo/utils`) combined with **Subpath Exports** for sharing internal logic.

1. **Stateless Logic (Helpers/Parsers):** Shared stateless logic will live in an internal monorepo package (e.g., `@repo/utils`). Using our bundler (`tsdown`), this logic will be physically inlined into the distributables of the consuming published packages (`@arkenv/core`, `@arkenv/standard`).
2. **Stateful Logic (Singletons/Schemas):** Any stateful logic or singleton configuration will be managed via Subpath Exports directly from the core packages, rather than using peer dependencies to enforce a single instance.

## Rationale

### 1. Why Not The NestJS Peer Dependency Model?

NestJS is a heavy, opinionated framework. It extensively uses `peerDependencies` (e.g., `@nestjs/core`, `@nestjs/common`) and relies on the user's package manager (npm/pnpm/yarn) to hoist these dependencies to the root of the project, theoretically ensuring a single instance of the framework's IoC container across the app. 

This works for NestJS because users expect a rigid, complex dependency graph within a tightly controlled application boundary.

However, this is fundamentally incompatible with Arkenv for several reasons:
- **Version Skew and Phantom Dependencies:** Monorepo package managers notoriously struggle with strict peer dependency hoisting. If a user installs a slightly different version of a sub-package, the package manager may duplicate the dependency in `node_modules`.
- **Fatal for Structural Typing:** Arkenv relies heavily on ArkType, which evaluates schemas using structural typing, `instanceof` checks, and strict object identity under the hood. If a duplicated instance of the core engine or ArkType is loaded due to peer dependency failure, schema evaluation and type scoping break silently at runtime. We cannot afford to trust hoisting for singleton integrity.

### 2. Why Not a Published `@arkenv/utils` Package?

The standard alternative to peer dependencies is a centralized utility package. We could create an `@arkenv/utils` package and publish it to npm, having `@arkenv/core` and `@arkenv/standard` depend on it normally.

This introduces unacceptable friction:
- **Public API Surface Bloat:** We would be forced to publish purely internal implementation details to npm.
- **Dependency Graph Bloat:** Users must download additional packages, slowing down install times and increasing the overall node_modules footprint.
- **Cascading Version Bumps:** Updating a single internal helper function would require bumping `@arkenv/utils`, which then requires bumping `@arkenv/core` and `@arkenv/standard`, and likely all the framework plugins, turning minor internal refactors into massive versioning chores.

### 3. The Power of Inlined Internal Packages

By keeping `@repo/utils` purely as a local workspace package, we achieve the best of both worlds:
- **Zero Distribution Cost:** Using `tsdown`, we inline the specific functions we need directly into the published bundles. At runtime, the user downloads zero external utility packages. The logic is fully self-contained.
- **Excellent Monorepo DX:** We maintain the developer experience of sharing typed code across our monorepo during development.
- **Build Tool Stability:** Inlined code avoids the issue where "build tools crash on Edge runtimes." If we used external packages that inadvertently pulled in Node-native modules (like `fs` or `path`), Edge deployment platforms (like Vercel) would crash. Inlining allows us to strictly control the exact code entering the runtime payload.

## Consequences

- **Positive:** No version skew or runtime duplication risks.
- **Positive:** Faster user installs with fewer packages.
- **Positive:** Reduced version bump cascading.
- **Negative:** The compiled bundle size of the core packages might be trivially larger due to inlined helpers, but this is mitigated by tree-shaking and the lightweight nature of the utilities.
