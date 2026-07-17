# Packages

This directory contains the workspace packages for the ArkEnv ecosystem.

## Purpose

The `packages/` directory is the home for code modules that are shared across the monorepo or published externally to npm:

- **Published NPM Packages**: Public-facing libraries, integration plugins, and executables.
- **Private Internal Packages** (`packages/internal/*`): Shared internal utilities, types, and logic used across published packages but not published to npm.

### What belongs here vs. `apps/`?

- **CLIs & Libraries**: If a codebase is published to npm for end-users to use—even if it is an executable/CLI like `arkenv` and not an importable library—it belongs here in `packages/`.
- **Applications & Tests (`apps/`)**: Standalone, deployed apps like documentation sites, playgrounds, or testing suites (like Playwright E2E tests) that are not published to npm go in `apps/`.

## Package directory

| Directory                      | Package Name          | Type    | Description                                                                   |
| :----------------------------- | :-------------------- | :------ | :---------------------------------------------------------------------------- |
| [`core`](./core)               | `@arkenv/core`        | Public  | Core typesafe environment variable parser using ArkType.                      |
| [`standard`](./standard)       | `@arkenv/standard`    | Public  | Dependency-free, typesafe environment variable parser using Standard Schema.  |
| [`arkenv`](./arkenv)           | `arkenv`              | Public  | Scaffolding CLI tool (run via `npx arkenv` or installed as a dev dependency). |
| [`vite-plugin`](./vite-plugin) | `@arkenv/vite-plugin` | Public  | Vite integration for build-time validation.                                   |
| [`nextjs`](./nextjs)           | `@arkenv/nextjs`      | Public  | Next.js integration with automatic runtimeEnv code generation.                |
| [`bun-plugin`](./bun-plugin)   | `@arkenv/bun-plugin`  | Public  | Bun integration for static env variable inlining.                             |
| [`nuxt`](./nuxt)               | `@arkenv/nuxt`        | Public  | Nuxt integration for environment variable validation and injection.           |
| [`fumadocs-ui`](./fumadocs-ui) | `@arkenv/fumadocs-ui` | Public  | Fumadocs UI components and utilities.                                         |
| [`build`](./build)             | `@arkenv/build`       | Public  | Shared build and codegen utilities for framework plugins.                     |
| [`internal/`](./internal)      | `@repo/*`             | Private | Shared internal modules (types, scopes, keywords) used for building.          |

## Versioning & releases

Packages in this directory (unless marked `"private": true` like `@repo/*`) are published to the npm registry:

1. Changes to published packages require a changeset. Run `pnpm changeset` to document your changes.
2. Changesets are committed to the `.changeset/` directory.
3. Merging changes to the main branch triggers release workflows and automated publishing.
