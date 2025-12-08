# Project Context

## Purpose

ArkEnv is a typesafe environment variable parser powered by [ArkType](https://arktype.io/), TypeScript's 1:1 validator. The project provides:

- **Zero external dependencies** (except peer dependencies)
- **Typesafe environment variables** with build-time and runtime validation
- **Tiny bundle size** (<1kB gzipped goal)
- **Cross-platform support** for Node.js, Bun, and browser environments
- **Vite plugin** for build-time validation
- **Single import, zero config** for most projects

The main goal is to provide a developer-friendly way to validate and type-check environment variables using familiar TypeScript-like syntax, ensuring applications fail fast with clear error messages when environment variables are missing or invalid.

## Tech Stack

### Core Technologies
- **TypeScript 5.9.3** - Primary language with strict type checking
- **ArkType 2.1.26** - Type validation library (peer dependency)
- **pnpm 10.22.0** - Package manager for monorepo
- **Turborepo 2.6.1** - Monorepo build system and task orchestration

### Build & Development Tools
- **tsdown 0.16.1** - TypeScript bundler for packages
- **Biome 2.3.5** - Linting and formatting (replaces ESLint/Prettier)
- **Vitest 4.0.9** - Unit and integration testing framework
- **Playwright 1.56.1** - End-to-end testing for www application

### Applications
- **Next.js 16.0.3** - Documentation site (www app)
- **React 19.2.0** - UI framework for documentation
- **Vite 7.2.2** - Build tool for vite-plugin package and playgrounds
- **Bun** - Alternative runtime (supported via examples and playgrounds)

### Infrastructure & Services
- **Changesets** - Version management and changelog generation
- **Sentry** - Error tracking for www application
- **Vercel Analytics** - Analytics for documentation site

## Project Conventions

### Code Style

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
- **Files**: kebab-case (`create-env.ts`)
- **Functions**: camelCase (`createEnv`)
- **Types**: PascalCase (`ArkEnvError`)
- **Constants**: UPPER_SNAKE_CASE for environment variables

**Code Quality Rules:**
- Don't reassign function parameters (`noParameterAssign` error)
- Place default parameters last (`useDefaultParameterLast` error)
- Always initialize enum values (`useEnumInitializers` error)
- Use self-closing JSX elements (`useSelfClosingElements` error)
- Declare one variable per statement (`useSingleVarDeclarator` error)
- Prefer `Number.parseInt` over global `parseInt` (`useNumberNamespace` error)
- Console usage is a warning (allowed in `bin/` and examples/playgrounds)

### Architecture Patterns

**Monorepo Structure:**
- **Packages** (`packages/`) - Published npm packages
  - `arkenv` - Core library package
  - `@arkenv/vite-plugin` - Vite plugin package
- **Apps** (`apps/`) - Applications (not published)
  - `www` - Next.js documentation site
  - `playgrounds/*` - Test playgrounds for different runtimes
- **Examples** (`examples/`) - Standalone example projects
- **Tooling** (`tooling/`) - Development tools (not published)

**Package Architecture:**
- **Core Package** (`arkenv`):
  - Main export: `createEnv` function (also exported as default `arkenv`)
  - Uses ArkType's `scope` system for type validation
  - Custom types: `string.host`, `number.port`, `boolean`
  - Error handling via `ArkEnvError` class
  - Zero external dependencies (except `arktype` as peer dependency)

**Build System:**
- Turborepo for task orchestration and caching
- `tsdown` for building packages (generates ESM + CJS + types)
- Size limits enforced via `size-limit` (<2kB per package)
- Workspace protocol (`workspace:*`) for internal dependencies

**Module Resolution:**
- Requires modern TypeScript module resolution:
  - `moduleResolution: "bundler"` (recommended for modern bundlers)
  - `moduleResolution: "node16"` or `"nodenext"` (for Node.js projects)

### Testing Strategy

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

### Git Workflow

**Branching:**
- Create feature branches from `main`
- Use descriptive branch names

**Versioning:**
- Uses **Changesets** for version management
- Create changeset with `pnpm changeset` before committing
- Changesets are in `.changeset/` directory
- Only published packages (`packages/*`) require changesets
- Examples and tooling don't need changesets

**Commits:**
- Commit changeset file along with code changes
- Changesets automatically generate changelogs and version bumps

**Publishing:**
- Run `pnpm release` after merging PRs to publish packages
- Only packages in `packages/` are published to npm

## Domain Context

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

**Type System:**
- Uses `const` type parameters for better type inference
- Leverages ArkType's `type.infer` and `type.validate` utilities
- Typesafe environment object returned from `createEnv`

**Error Handling:**
- `ArkEnvError` extends `Error` and formats ArkType validation errors
- Errors include variable names and expected types
- Fail-fast approach: app won't start if validation fails

## Important Constraints

**Bundle Size:**
- Core package must be <1kB gzipped (enforced via `size-limit`)
- Vite plugin must be <2kB (enforced via `size-limit`)
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
- Supports Vite 2.9.18 through 7.x
- Validates environment variables at build-time
- Injects validated variables into build

**Monorepo Constraints:**
- All packages must use `workspace:*` protocol for internal dependencies
- Internal workspace dependencies (e.g., `@repo/*`) are permitted in both `dependencies` and `devDependencies` if bundled
- Only packages in `packages/` are published
- Examples and tooling are not published
- Changesets required for published packages only

## External Dependencies

**Peer Dependencies:**
- **arktype** (^2.1.22) - Required by both `arkenv` and `@arkenv/vite-plugin`
- **vite** (^2.9.18 || ^3.0.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0) - Required by `@arkenv/vite-plugin`

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
