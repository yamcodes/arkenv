# Independent Versioning Strategy

## Context

ArkEnv is a monorepo containing a core engine, a CLI codegen tool, multiple framework plugins, and build utilities. Choosing a single versioning strategy for all packages leads to unnecessary releases and coupling.

For example:

- A bug fix in `@arkenv/nextjs` should not force a new version of `arkenv`.
- A breaking change in `arkenv` should be reflected immediately in `@arkenv/cli` to prevent schema/codegen version mismatches.

## Decision

We will adopt an **independent versioning model** where all packages in the monorepo float independently. There is no locked inner circle because ArkEnv has a single core engine package (`arkenv`), and all other packages (including `@arkenv/cli`) act as independent consumers or utilities.

### Future Core Package Split

If the `arkenv` package is ever split into `@arkenv/core` and `@arkenv/standard` in the future, those two packages **must be versioned together in lockstep** (added to the `fixed` group in the Changesets config). Because they would constitute the core runtime engine together, a version mismatch between them could cause critical compatibility errors or break structural typing. For now, since `arkenv` is a single package, the `fixed` group remains empty.

### Independent Outer Ring

The following packages float independently:

- The CLI codegen tool: `@arkenv/cli`
- Framework plugins: `@arkenv/nextjs`, `@arkenv/nuxt`, `@arkenv/vite-plugin`, `@arkenv/bun-plugin`
- Build utilities: `@arkenv/build`, `@arkenv/fumadocs-ui`

**Rationale:** These packages integrate with external frameworks and tools that evolve on their own schedules. A local integration fix (e.g., adapting to a new Next.js API) or a tweak to a CLI prompt should not trigger a core engine release. Independent versioning allows us to ship plugin-specific and tooling-specific fixes without cascading version bumps to the entire ecosystem. The CLI (`@arkenv/cli`) itself is merely a scaffolding utility that writes configuration files; it does not depend on deep `arkenv` internals, and therefore does not need to be version-locked to the core engine.

### The Glue (Strict Peer Dependencies)

All framework plugins declare `arkenv` as a **strict peer dependency**:

- This enforces compatibility at the package manager level.
- Users are warned (or blocked) if they install an incompatible plugin/core combination.
- It prevents silent version skew that could break structural typing at runtime.

#### Monorepo Protocol: `workspace:*` vs `workspace:^`

Because this is a monorepo, plugins reference the local `arkenv` package during development. We use two different workspace protocols depending on the dependency field:

**`devDependencies`: `"arkenv": "workspace:*"`**

- During local development, this links directly to the workspace package (the folder in `packages/arkenv`), regardless of its current version.
- When published to npm, pnpm rewrites `workspace:*` to the **exact current version** (e.g., `"1.0.0-alpha.1"`).
- This is correct for `devDependencies` because they are not installed by end users.

**`peerDependencies`: `"arkenv": "workspace:^"`**

- During local development, this also links to the workspace package.
- When published to npm, pnpm rewrites `workspace:^` to a **caret range** (e.g., `"^1.0.0-alpha.1"`).
- This is **mandatory** for `peerDependencies`. Using `workspace:*` here would publish an exact pin, meaning every patch release of `arkenv` would trigger an unmet peer dependency warning for all users until they manually update every plugin. The caret range allows users to upgrade `arkenv` within the major version without friction.

**`dependencies` (Highly Coupled Internals): `"arkenv": "workspace:~"`**

- For internal packages that rely on undocumented or deep-level APIs of `arkenv` (e.g., a future `@arkenv/parser` or codegen utility that reaches into internal schema shapes), `workspace:~` is the appropriate protocol.
- When published, pnpm rewrites `workspace:~` to a **tilde range** (e.g., `"~1.0.0-alpha.1"`), which allows patch updates but locks the minor version.
- This ensures that a minor feature update to `arkenv` cannot silently break the coupled internal tool. If `arkenv` bumps its minor version, the dependent package must also be released and bumped.
- **Not currently used** in the ArkEnv monorepo, but reserved for future highly-coupled internal tools.

| Field                  | Protocol      | Local Dev          | Published                       |
| ---------------------- | ------------- | ------------------ | ------------------------------- |
| `devDependencies`      | `workspace:*` | Links to workspace | Exact version (`1.0.0-alpha.1`) |
| `peerDependencies`     | `workspace:^` | Links to workspace | Caret range (`^1.0.0-alpha.1`)  |
| `dependencies` (tight) | `workspace:~` | Links to workspace | Tilde range (`~1.0.0-alpha.1`)  |

> **Reference:** See [pnpm documentation on publishing workspace packages](https://pnpm.io/workspaces#publishing-workspace-packages) for full details on how `workspace:` protocols are rewritten during publish.

## Consequences

- **Positive:** Core engine stability. Inner-circle releases are deliberate and reflect genuine engine or codegen changes.
- **Positive:** Plugin agility. Framework integrations can iterate and release quickly without coordinating with core releases.
- **Positive:** Clear contract. Users understand that `arkenv` and `@arkenv/cli` move together, while plugins move at their own pace.
- **Positive:** Peer dependency enforcement catches mismatched installations early.
- **Negative:** Slightly more complex release management (Changesets handles this via the `fixed` and `independent` configuration mix).
- **Negative:** Plugin authors must ensure peer dependency ranges accurately reflect tested compatibility.
