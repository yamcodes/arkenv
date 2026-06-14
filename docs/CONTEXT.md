# Project context

## Purpose

ArkEnv is a typesafe environment variable parser powered by [ArkType](https://arktype.io/), TypeScript's 1:1 validator. The project provides:

- **Zero external dependencies** (except peer dependencies)
- **Typesafe environment variables** with build-time and runtime validation
- **Tiny bundle size** (\<2kB gzipped goal)
- **Cross-platform support** for Node.js, Bun, and browser environments
- **Vite plugin** for build-time validation
- **Single import, zero config** for most projects

The main goal is to provide a developer-friendly way to validate and type-check environment variables using familiar TypeScript-like syntax, ensuring applications fail fast with clear error messages when environment variables are missing or invalid.

## Tech stack

### Core technologies

- **TypeScript 6** - Primary language with strict type checking
- **ArkType 2** - Type validation library (peer dependency)
- **pnpm 11** - Package manager for monorepo
- **Turborepo 2** - Monorepo build system and task orchestration

### Build & development tools

- **tsdown 0.16** - TypeScript bundler for packages
- **Biome 2** - Linting and formatting (replaces ESLint/Prettier)
- **Vitest 4** - Unit and integration testing framework
- **Playwright 1.56** - End-to-end testing for www application

### Applications

- **Next.js 16** - Documentation site (www app)
- **React 19** - UI framework for documentation
- **Vite 8** - Build tool for vite-plugin package and playgrounds
- **Bun** - Alternative runtime (supported via examples and playgrounds)

### Infrastructure & services

- **Changesets** - Version management and changelog generation
- **Sentry** - Error tracking for www application
- **Vercel Analytics** - Analytics for documentation site

## Project conventions

### Code style

**Formatting & Linting:**

- Uses **Biome** for all formatting and linting (no ESLint/Prettier)
- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for strings
- **Imports**: Auto-organized by Biome

**TypeScript Conventions:**

- Prefer `type` over `interface` for type definitions
- Use TypeScript 5.1+ features (const type parameters, etc.)
- Avoid explicit types when TypeScript can infer them (`noInferrableTypes` error)
- Use `as const` for immutable values (`useAsConstAssertion` error)
- Use JSDoc comments for public APIs

**Naming Conventions:**

- **Files**: kebab-case (`arkenv.ts`)
- **Functions**: camelCase (`arkenv`)
- **Types**: PascalCase (`ArkEnvError`)
- **Constants**: UPPER_SNAKE_CASE for environment variables

**Code Quality Rules:**

- Don't reassign function parameters (`noParameterAssign` error)
- Place default parameters last (`useDefaultParameterLast` error)
- Always initialize enum values (`useEnumInitializers` error)
- Use self-closing JSX elements (`useSelfClosingElements` error)
- Declare one variable per statement (`useSingleVarDeclarator` error)
- Prefer `Number.parseInt` over global `parseInt` (`useNumberNamespace` error)
- Console usage is a warning (allowed in `scripts/` and examples/playgrounds)

### Architecture patterns

**Monorepo Structure:**

- **Packages** (`packages/`) - Published npm packages
  - `arkenv` - Core library package
  - `@arkenv/vite-plugin` - Vite plugin package
  - `@arkenv/cli` - Interactive CLI for scaffolding and project mutation
- **Apps** (`apps/`) - Applications and testing suites (not published)
  - `www` - Next.js documentation site
  - `playgrounds/*` - Test playgrounds for different runtimes
  - `playwright-www` - Playwright E2E tests for the www application
- **Examples** (`examples/`) - Standalone example projects

**Package Architecture:**

- **Core Package** (`arkenv`):
  - Main export: `arkenv` function (also exported as default export)
  - Uses ArkType's `scope` system for type validation
  - Custom types: `string.host`, `number.port`, `boolean`
  - Error handling via `ArkEnvError` class
  - Zero external dependencies (except `arktype` as peer dependency)

**Build System:**

- Turborepo for task orchestration and caching
- `tsdown` for building packages (generates ESM + CJS + types)
- Size limits enforced via `size-limit` (\<2kB per package)
- Workspace protocol (`workspace:*`) for internal dependencies

**Module Resolution:**

- Requires modern TypeScript module resolution:
  - `moduleResolution: "bundler"` (recommended for modern bundlers)
  - `moduleResolution: "node16"` or `"nodenext"` (for Node.js projects)

### Testing strategy

**Testing Philosophy:**

- **"Examples as Test Fixtures"** - Examples serve as both documentation and test fixtures
- **"Test the User Journey"** - E2E tests validate complete workflows
- **"Test behavior, not aesthetics"** - Focus on public API and user behavior

**Test Types:**

1. **Unit Tests** (`*.test.ts`) - Fast, isolated tests with mocked dependencies
2. **Integration Tests** (`*.integration.test.ts`) - Test multiple units working together
3. **Fixture-Based Tests** - Use real example projects as test fixtures (vite-plugin)
4. **End-to-End Tests** - Playwright tests for www application across browsers

**Test Organization:**

- Co-locate tests: `Component.tsx` next to `Component.test.tsx`
- Use Testing Library + user-event for component tests
- Query by role, name, label, and text (accessibility first)
- Mock at component boundaries (network, time, context)

**Running Tests:**

```bash
pnpm test -- --run                    # All tests
pnpm test --project arkenv -- --run  # Specific package
pnpm test -- --run "integration"     # Integration tests only
pnpm run test:e2e                     # E2E tests
```

### Git workflow

**Branching:**

- Create feature branches from `dev`
- `dev` is the default branch and continuous integration target
- **Base Branch & Comparisons**: Always use `origin/dev` (not `main` or `origin/main`) for any `git diff` checks, branch bases, or code comparisons unless explicitly instructed otherwise.
- **PR Target Branch**: When opening a Pull Request (via `gh pr create` or the GitHub UI), always ensure the target base branch is set to `dev` (which is the default on GitHub), unless you are specifically applying a documentation hotfix directly to `main`.
- `main` is the production release branch, updated only after a successful npm publish
- The documentation site (`apps/www`) deploys strictly from `main` to prevent unreleased features from appearing live
- To make immediate typo or cosmetic fixes to the live docs without a package release, push directly to `main` and use the `sync-main` workflow/skill to cherry-pick and reconcile those changes back into `dev`
- Use descriptive branch names

**Versioning:**

- Uses **Changesets** for version management
- Create changeset with `pnpm changeset` before committing
- Changesets are in `.changeset/` directory
- Only published packages (`packages/*`) require changesets
- Examples and private applications don't need changesets

**Commits:**

- Commit changeset file along with code changes
- Changesets automatically generate changelogs and version bumps

**Publishing:**

- Run `pnpm release` after merging PRs to publish packages
- Only packages in `packages/` are published to npm

## Domain context

**Environment Variable Validation:**

- ArkEnv uses ArkType's type system to validate environment variables
- Schema is defined using TypeScript-like syntax (e.g., `"string.host"`, `"number.port"`)
- Validation happens at both build-time (via Vite plugin) and runtime
- Missing or invalid variables throw `ArkEnvError` with clear error messages

**ArkType Integration:**

- Uses ArkType's `scope` system to extend base types
- Custom types defined in `scope.ts`:
  - `string.host` - Validates IP addresses or "localhost"
  - `number.port` - Validates port numbers (0-65535)
  - `boolean` - Validates boolean values
- The `$` variable naming convention is used for the root scope (ArkType convention)

**Framework & Runtime Integrations:**

- **Vanilla**: The default runtime-only core module for Node.js, Bun, and Deno. Uses `import { env } from "./env"`. Validated environment variables are accessed directly from the returned `env` object for typesafety. Primarily used for **server-side** or runtime-only validation. No plugins are required.
- **Vite**: Integrated via `@arkenv/vite-plugin`. Validates environment variables at build-time and inlines `import.meta.env` variables for **client-side** (browser) usage.
- **Next.js**: Integrated via `@arkenv/nextjs`. Provides two layout patterns:
  - **Strict layout**: Uses separate environment files for client, server, and shared scopes (`env/client.ts`, `env/server.ts`, and `env/internal/shared.ts`) for compile-time locking of secrets from browser bundles using package conditional exports (`react-server` vs. `default`) and `server-only`.
  - **Simple layout**: Uses a single `env.ts` schema file. In Next.js, client-side environment variables must be statically destructured in a `runtimeEnv` block to allow static inlining by the Next.js compiler. To automate this, `@arkenv/nextjs/config` exposes a `withArkEnv` wrapper for `next.config.js` that performs static analysis on `env.ts` to locate `client` and `shared` keys, then automatically generates a tailored `arkenv` factory in `generated/env.gen.ts` that pre-fills `runtimeEnv`. It enforces strict client-side prefixing (`NEXT_PUBLIC_`) and prevents server secrets from leaking to client components.
- **Bun fullstack dev server**:
  - **Bun.serve**: An HTTP server runtime that integrates with Bun's built-in bundler to scan HTML files, trigger on-demand bundling, and serve resulting assets. It does not perform bundling itself; rather, it coordinates with Bun's bundler (configured via `@arkenv/bun-plugin` in `bunfig.toml`) to inline environment variables (e.g., using a `PUBLIC_` prefix) via static replacement. Primarily used for **client-side** bundling integration.
  - **Bun.build**: Bun's programmatic bundling API. Integrated via `@arkenv/bun-plugin` in the `Bun.build` plugins array. Used for custom build scripts targeting the browser in a fullstack context.

**Preferred Bun Vocabulary:**

- **Bun fullstack dev server**: also known as "Bun development server", the unified terminology for Bun applications that involve frontend bundling or integrated dev servers.
  - **Bun.serve**: The unified Bun process that handles both API routes and integrated frontend bundling.
  - **Bun.build**: The programmatic API for creating custom frontend build pipelines.
- **Frontend / Client-side**: Code intended to run in the browser, where environment variables must be **inlined** during bundling.
- **Backend / Server-side**: Code running in the Bun runtime, where environment variables are accessed directly from the environment.
- **Static Inlining**: The process where a bundler replaces `process.env.VAR` with a literal value. In Bun, this is configured via the `env` option in `bunfig.toml` or `Bun.build`.

**Type System:**

- Uses `const` type parameters for better type inference
- Leverages ArkType's `type.infer` and `type.validate` utilities
- Typesafe environment object returned from `arkenv`

**Error Handling:**

- `ArkEnvError` extends `Error` and formats ArkType validation errors
- Errors include variable names and expected types
- Fail-fast approach: app won't start if validation fails

## Important constraints

**Bundle Size:**

- Core package must be \<2kB gzipped (enforced via `size-limit`)
- Vite plugin must be \<2kB (enforced via `size-limit`)
- Zero external dependencies (except peer dependencies). Internal workspace packages are permitted.

**TypeScript Requirements:**

- TypeScript >= 5.1 required
- Modern module resolution required (`bundler`, `node16`, or `nodenext`)
- Strict type checking enabled

**Runtime Support:**

- Tested on Node.js LTS and Current (22 and 25)
- Tested on Bun 1.2+
- Browser support via Vite plugin

**Vite Plugin Compatibility:**

- Supports Vite 4.x through 8.x
- Validates environment variables at build-time
- Injects validated variables into build

**Monorepo Constraints:**

- All packages must use `workspace:*` protocol for internal dependencies
- Internal workspace dependencies (e.g., `@repo/*`) are permitted in both `dependencies` and `devDependencies` if bundled
- Only packages in `packages/` are published
- Examples and private apps are not published
- Changesets required for published packages only

## External dependencies

**Peer Dependencies:**

- **arktype** (^2.1.22) - Required by both `arkenv` and `@arkenv/vite-plugin`
- **vite** (^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0) - Required by `@arkenv/vite-plugin`

**External Services (www app only):**

- **Sentry** - Error tracking and monitoring
- **Vercel Analytics** - Analytics for documentation site
- **PostHog** - Product analytics

**Build Dependencies:**

- **@sentry/cli** - Sentry CLI for source maps (onlyBuiltDependencies)
- **@swc/core** - Fast TypeScript/JavaScript compiler (onlyBuiltDependencies)
- **esbuild** - Fast bundler (onlyBuiltDependencies)
- **sharp** - Image processing (onlyBuiltDependencies)

**Note:** The core `arkenv` package has zero external dependencies (except `arktype` as a peer dependency), keeping the bundle size minimal.
