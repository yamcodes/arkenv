# ADR 0012: Independent Versioning Strategy

## Status

Accepted

## Context

ArkEnv is a monorepo containing a core engine, a CLI scaffolding tool, multiple framework plugins, and build utilities. Choosing a single versioning strategy for all packages leads to unnecessary releases and coupling.

For example:

- A bug fix in `@arkenv/nextjs` should not force a new version of `arkenv`.
- An update to the CLI tool `arkenv` (e.g., modifying its interactive prompt or code templates) should not require a new release of `@arkenv/core`.

## Decision

We will adopt an **independent versioning model** where all packages in the monorepo float independently, with the exception of the core runtime packages.

### Core Package Split & Lockstep Versioning

The core validation runtime is split into two packages:

- `@arkenv/core` (using ArkType)
- `@arkenv/standard` (dependency-free, using Standard Schema)

These two packages **are versioned together in lockstep** (grouped under the `fixed` section in the Changesets configuration). Because they constitute the core runtime engine together, a version mismatch between them could cause critical compatibility errors or break structural typing.

### Independent Outer Ring

The following packages float independently:

- The CLI scaffolding tool: `arkenv`
- Framework plugins: `@arkenv/nextjs`, `@arkenv/nuxt`, `@arkenv/vite-plugin`, `@arkenv/bun-plugin`
- Build utilities: `@arkenv/build`, `@arkenv/fumadocs-ui`

**Rationale:** These packages integrate with external frameworks and tools that evolve on their own schedules. A local integration fix (e.g., adapting to a new Next.js API) or a tweak to a CLI prompt should not trigger a core engine release. Independent versioning allows us to ship plugin-specific and tooling-specific fixes without cascading version bumps to the entire ecosystem. The CLI (`arkenv`) itself is merely a scaffolding utility that writes configuration files; it does not depend on deep core internals, and therefore does not need to be version-locked to the core engine.

### The Glue (Strict Peer Dependencies)

All framework plugins (e.g., `@arkenv/nextjs`, `@arkenv/bun-plugin`) declare the core packages (`@arkenv/core` and `@arkenv/standard`) as **strict peer dependencies** rather than regular dependencies.

#### Why not regular dependencies?

- **Avoid Duplication & Runtime Failures:** Wrapping core packages as regular dependencies in plugins risks duplicating them in `node_modules` (due to varying version resolution matching or hoisting strategies of package managers).
- **Structural Typing & Singletons:** Duplication breaks ArkType's structural typing and `instanceof` checks (e.g., schema validation context, symbols, internal singletons). Having a single shared instance of the core packages across the user's codebase is critical.
- **Enterprise Precedent (SDK Integrations):** This Wide Peer approach follows the standard set by major framework SDKs that rely on singleton states or structural typing. For example, `@supabase/ssr` relies on `peerDependencies` for `@supabase/supabase-js`, `@trpc/next` relies on `peerDependencies` for `@trpc/server`, and `@stripe/react-stripe-js` relies on `peerDependencies` for `@stripe/stripe-js`. This is to guarantee singletons and avoid duplicate instance crashes.

#### Enforcing Peer Dependencies Without Sacrificing DX

While requiring peer dependencies can sometimes lead to extra manual installation steps, the developer experience (DX) is fully preserved:

- **CLI-Forward Scaffolding:** The starting point and primary onboarding path for ArkEnv projects is running `npx arkenv init`. This CLI-forward approach handles project initialization, dependency installation, and boilerplate generation automatically.
- **Auto-Installation:** Modern package managers (NPM v7+, PNPM, Yarn) automatically resolve and install peer dependencies by default, removing manual friction for the end user while maintaining runtime singleton safety.

#### Monorepo Protocol: `workspace:*` vs `workspace:^`

Because this is a monorepo, plugins reference the local core packages during development. We use two different workspace protocols depending on the dependency field:

**`devDependencies`: `"@arkenv/core": "workspace:*", "@arkenv/standard": "workspace:*"`**

- During local development, this links directly to the workspace package (the folders in `packages/core` and `packages/standard`), regardless of its current version.
- When published to npm, pnpm rewrites `workspace:*` to the **exact current version** (e.g., `"1.0.0-alpha.1"`).
- This is correct for `devDependencies` because they are not installed by end users.

**`peerDependencies`: `"@arkenv/core": "^1.0.0", "@arkenv/standard": "^1.0.0"`**

- We use the **Wide Peer** strategy by hardcoding the absolute minimum supported version of the core packages. We completely drop the `workspace:` prefix here.
- This decoupling is necessary to solve the "Artificial Floor" problem where using `workspace:^` forces the published package to artificially require the exact version of the core engine present in the monorepo at publish time.
- Because it is a regular hardcoded range, anyone from `1.0.0` upwards can install the new plugin update without being forced to upgrade their core engine.

**`dependencies` (Highly Coupled Internals): `"@arkenv/core": "workspace:~"`**

- For internal packages that rely on undocumented or deep-level APIs of the core packages (e.g., a future `@arkenv/parser` or codegen utility that reaches into internal schema shapes), `workspace:~` is the appropriate protocol.
- When published, pnpm rewrites `workspace:~` to a **tilde range** (e.g., `"~1.0.0-alpha.1"`), which allows patch updates but locks the minor version.
- This ensures that a minor feature update to the core packages cannot silently break the coupled internal tool. If `@arkenv/core` bumps its minor version, the dependent package must also be released and bumped.
- **Not currently used** in the ArkEnv monorepo, but reserved for future highly-coupled internal tools.

| Field                  | Protocol      | Local Dev           | Published                       |
| :--------------------- | :------------ | :------------------ | :------------------------------ |
| `devDependencies`      | `workspace:*` | Links to workspace  | Exact version (`1.0.0-alpha.1`) |
| `peerDependencies`     | `^1.0.0`      | Standard resolution | Hardcoded range (`^1.0.0`)      |
| `dependencies` (tight) | `workspace:~` | Links to workspace  | Tilde range (`~1.0.0-alpha.1`)  |

> **Reference:** See [pnpm documentation on publishing workspace packages](https://pnpm.io/workspaces#publishing-workspace-packages) for full details on how `workspace:` protocols are rewritten during publish.

## Consequences

- **Positive:** Core engine stability. The core `@arkenv/core` and `@arkenv/standard` packages are only released when there are genuine engine-level changes or bug fixes.
- **Positive:** Plugin agility. Framework integrations can iterate and release quickly without coordinating with core releases.
- **Positive:** Clear contract. Users understand that each tool (including the `arkenv` CLI) floats and releases on its own schedule.
- **Positive:** Peer dependency enforcement catches mismatched installations early.
- **Negative:** Release management requires tracking changelogs and versions across separate packages independently.
- **Negative:** Plugin authors must ensure peer dependency ranges accurately reflect tested compatibility.
