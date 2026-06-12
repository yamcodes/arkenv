# 0007. Shared Build and Codegen Package

## Context

ArkEnv provides framework-specific plugins (such as `@arkenv/nextjs` and `@arkenv/nuxt`) that statically scan environment schemas (e.g. `env.ts`) to automatically generate typesafe environment factories (`env.gen.ts`).

This process requires:
1. Regex-based AST analysis of TypeScript files to extract server, client, and shared keys.
2. File watching using `chokidar` during development mode.
3. Common layout detection logic (`simple` vs `strict`).

Currently, this code is duplicated between `@arkenv/nextjs` and `@arkenv/nuxt`. We need a strategy to share this logic that satisfies three requirements:
* **Zero core dependencies**: The core library (`arkenv` / `@arkenv/core`) must maintain its "zero external runtime dependencies" promise and remain extremely lightweight.
* **Platform isolation**: The core library must remain edge-compatible; Node-only modules (`node:fs`, `node:path`) and watcher processes must not be loaded or bundled into the core package.
* **Infrastructure ergonomics**: The solution should not introduce build/deployment complexity in Docker files, CI/CD pipelines, or other remote hosting environments.

---

## Considered Alternatives

### 1. Private Workspace Package (`@repo/build-utils`)

In this model, we create a private workspace package (e.g., `packages/internal/build-utils`) with `"private": true` in `package.json`.

* **Pros**:
  * **Zero registry footprint**: It is never published to npm, keeping our public package list clean and focused.
  * **No Changesets overhead**: Since it is never published, we can exclude it from Changesets tracking entirely.
* **Cons**:
  * **Infrastructure Clunkiness**: Private workspace packages can break multi-stage Docker builds, remote deployment pipelines (like Vercel/Netlify), or external monorepo consumers. They require pnpm workspace resolution to be set up everywhere, which adds build/deploy-time friction.
  * **Bundler Coupling**: The consuming plugins must inline/bundle this package at compile-time to prevent the published plugins from referencing a non-existent package on npm.

### 2. Published NPM Package (`@arkenv/build-utils` or `@arkenv/codegen`)

In this model, we publish a dedicated utility package under the `@arkenv` scope. We can manage this in two ways:

#### Sub-alternative A: Marketed as a Public Toolkit
We document and export it as a public API for developers to write their own custom build plugins.
* **Pros**: Enables the community to easily build new plugins (e.g. `@arkenv/astro`, `@arkenv/sveltekit`) using the official AST parser and watchers.
* **Cons**: We must maintain public API stability, write documentation, and support developers using it.

#### Sub-alternative B: Published but Marked as "Internal/Unstable"
We publish it to the npm registry, but document in its README that it is strictly for internal plugin use and is semver-unstable.
* **Pros**:
  * **Zero Infrastructure Friction**: Since it is a published npm package, it behaves like any normal dependency. It resolves cleanly in Docker files, remote CI servers, and deployment pipelines.
  * **Decoupled Bundling**: Consuming plugins can import it as a standard peer/dependency rather than being forced to inline it at build-time.
  * **Community Escape Hatch**: Experienced community developers can still import it to build custom plugins if needed, with the caveat that it is unstable.
* **Cons**:
  * **Changesets Overhead**: It must be tracked by Changesets. Every update to the parser/watcher requires a changeset, version bump, and npm release.
  * **Registry Clutter**: Adds another package to the `@arkenv` scope on npm.

### 3. Re-exporting from Core (`@arkenv/core/internal/config`)

* **Description**: Place the shared code under an internal subpath export in the core package.
* **Trade-offs**: Forces Node-only modules (`chokidar`, `node:fs`) into the core package, which ruins the "zero external runtime dependencies" promise and can trigger bundler warnings in edge-runtime environments.

---

## Decision

We decided to introduce a **published npm package** named **`@arkenv/build-utils`** (or **`@arkenv/codegen`**), but classify it as **strictly for internal plugin use** (Sub-alternative B).

1. **Published to npm**: The package will be published to the npm registry.
2. **README Warning**: The package will include a prominent warning stating that the API is unstable, undocumented, and intended solely for official `@arkenv/*` plugins.
3. **Changesets Tracking**: It will be included in our Changeset model.
4. **Standard Dependency**: Framework plugins will import it as a normal package dependency rather than bundling it.

---

## Justification

While private workspace packages (`@repo/*`) keep the npm registry clean, they introduce significant configuration friction in CI/CD pipelines, Docker compilation, and remote deployment runtimes. 

Publishing `@arkenv/build-utils` as a public-but-internal-intended package is the best compromise:
* It completely resolves the infrastructure clunkiness associated with private monorepo packages.
* It maintains the strict separation of runtime and build-time modules, preserving `@arkenv/core` as a zero-dependency, edge-compatible library.
* The overhead of Changesets and npm releases is a reasonable price to pay for standard package resolution and a clean, predictable monorepo build setup.
