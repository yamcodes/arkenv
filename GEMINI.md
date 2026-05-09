# ArkEnv

Environment variable validation from editor to runtime. ArkEnv is a typesafe environment variable validator for modern JavaScript runtimes, supporting ArkType (default), Zod, Valibot, and other Standard Schema validators.

## Project Architecture

This is a **pnpm monorepo** managed with **Turbo**.

- **packages/**
  - `arkenv/`: The core library.
  - `cli/`: The ArkEnv CLI tool.
  - `vite-plugin/`: Vite plugin for ArkEnv.
  - `bun-plugin/`: Bun plugin for ArkEnv.
  - `internal/`: Shared internal utilities and types.
- **apps/**
  - `www/`: Documentation website (Next.js + Fumadocs).
  - `playgrounds/`: Various environments for testing ArkEnv integrations.
- **examples/**: Usage examples for different frameworks and runtimes.

## Key Technologies

- **Language**: TypeScript
- **Validator**: [ArkType](https://arktype.io/) (Primary), supports [Standard Schema](https://standardschema.dev/)
- **Monorepo Tooling**: pnpm, Turbo, Manypkg
- **Building**: tsdown, esbuild
- **Testing**: [Vitest](https://vitest.dev/), Playwright (E2E)
- **Linting & Formatting**: [Biome](https://biomejs.dev/)
- **Releases**: Changesets

## Development Workflow

### Core Commands

- `pnpm install`: Install all dependencies.
- `pnpm build`: Build all packages and apps.
- `pnpm test`: Run the test suite.
- `pnpm check`: Run linting, formatting, and workspace checks.
- `pnpm run fix`: Automatically fix linting and formatting issues.
- `pnpm run dev`: Start development mode for all workspace members.
- `pnpm run docs`: Start the documentation site development server.

### Coding Conventions

- **Naming**: Use `kebab-case` for all filenames (enforced by Biome).
- **Types**: Prefer `type` over `interface` for consistency.
- **Formatting**: Handled by Biome. Run `pnpm run fix` before committing.
- **Imports**: Use Node.js `import` protocol (e.g., `import fs from "node:fs"`).

### Testing Strategy

- **Co-location**: Unit tests (`*.test.ts`) should be co-located with the source code.
- **Integration Tests**: Use `*.integration.test.ts` for tests involving multiple units or real interactions.
- **Examples as Fixtures**: Examples are used as real-world test cases in the CI pipeline.
- **Validation**: Always run `pnpm test` and `pnpm check` before submitting changes.

## Maintenance

- **Adding Contributors**: Use `pnpm contributors:add <username> <contribution-type>`.
- **Changesets**: Every PR that changes functionality must include a changeset via `pnpm changeset`. For v0 versions: use `patch` for non-breaking changes, `minor` for breaking changes, and avoid `major` unless explicitly instructed.
- **Syncing Examples**: Use `pnpm sync:examples` to keep example projects in sync with the core library structure.
