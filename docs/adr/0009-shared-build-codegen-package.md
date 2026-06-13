# Introduce @arkenv/build-utils for Shared Build and Codegen Logic

To centralize build-time schema parsing, layout resolution, and file-watching logic shared between framework integrations (like `@arkenv/nextjs` and `@arkenv/nuxt`) without bloating the core runtime package or introducing private monorepo packages.

## Context & problem

With the introduction of Nuxt support via `@arkenv/nuxt`, we needed to implement build-time AST schema parsing (to extract environment variable keys), layout resolution (to handle simple vs. strict multi-file layouts), and development file-watching using `chokidar`. Next.js already implements an identical workflow to generate the `env.gen.ts` file in development.

Duplicating this build-time parsing and watching logic across framework integration packages creates a maintenance burden. However, we had several constraints on how to share this logic:

1. **Zero-dependency Core**: We guarantee that the core `arkenv` (`@arkenv/core`) package has zero external dependencies, remains extremely lightweight, and is fully compatible with edge runtimes (e.g., Cloudflare Workers, Vercel Edge). Adding Node-specific dependencies like `chokidar` or AST parsing libraries directly to the core runtime package is not acceptable.
2. **No Relative Monorepo Hacks**: Using relative filesystem imports across package boundaries (e.g., importing from `../nextjs/src/...` inside `packages/nuxt`) violates monorepo encapsulation and causes distribution/bundling failures.
3. **No Private Monorepo Packages**: Establishing a private workspace package (e.g., `@repo/build-utils` or `@repo/kit`) was considered but rejected because private workspace packages complicate CI/CD, Docker multi-stage builds, and deployment setups for users and internal automated tooling.

## Decision

We decided to create a new, published npm package: `@arkenv/build-utils`.

1. **Publishing Status**: The package is published to npm but is explicitly documented in its README as an unstable, internal-only package. Changesets track `@arkenv/build-utils` to automate its versioning and publication.
2. **Centralized Responsibilities**: The package contains:
   - Layout resolution (`resolveLayout`) for simple vs. strict schema file/directory structures.
   - Key extraction (`extractKeys`, `extractClientKeys`, `extractSharedKeys`, `extractServerKeys`) via regex-based AST parsing.
   - Development file watching (`watchSchema`, `closeWatcher`) built on top of `chokidar` (v4).
3. **Package Usage**: `@arkenv/nextjs` and `@arkenv/nuxt` list `@arkenv/build-utils` as a regular dependency (or devDependency where appropriate) to access these shared helpers during build/dev phases.

## Consequences

- **Zero Core Bloat**: The core `arkenv` runtime package remains 100% dependency-free and edge-runtime compatible.
- **Dry Codebase**: Shared parser, watcher, and codegen logic is implemented and tested in a single package.
- **Robust CI/CD & Deployments**: Because `@arkenv/build-utils` is published to npm, package references resolve naturally through standard npm registries, avoiding the complexities of private monorepo references in production/deployment environments.
- **Internal Maintenance**: Changes to the build-time parsing logic must be versioned via Changesets under `@arkenv/build-utils`, which will automatically propagate minor/patch updates to downstream integrations.
