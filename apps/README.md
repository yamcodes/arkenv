# Apps

This directory contains standalone, non-published applications and playground environments.

## Purpose

The `apps/` directory is the home for projects that are not published as packages to the npm registry:

- **Documentation Site** (`apps/www`): The Next.js-powered documentation site for ArkEnv, deployed to Vercel.
- **Playgrounds** (`apps/playgrounds/*`): Framework and runtime environments (Vite, Bun, SolidStart, Node.js, standard schema, etc.) used to verify, test, and demonstrate ArkEnv features in real-world setups.

### What belongs here vs. `packages/`?

- **Applications & Tests (`apps/`)**: Projects that are deployable targets (like the docs website), testing suites (like Playwright E2E tests), or local integration testing workspaces (playgrounds) that do not get published to npm.
- **NPM Packages (`packages/`)**: Code libraries, plugins, or CLI executables (like `@arkenv/cli`) that are published to npm for end-users.

## Directory Structure

| Directory                       | Type           | Description                                                     |
| :------------------------------ | :------------- | :-------------------------------------------------------------- |
| [`www`](./www)                  | Next.js App    | The Next.js website and documentation portal.                   |
| [`playwright-www`](./playwright-www) | Test Suite     | Playwright end-to-end tests for the `www` application.          |
| [`playgrounds/`](./playgrounds) | Sub-workspaces | Local test playgrounds for Node.js, Bun, Vite, SolidStart, etc. |

## Versioning & Releases

All applications and playgrounds in this directory are private (`"private": true` in `package.json`):

- They are **ignored** by Changesets and are never published to npm.
- Version numbers (e.g., `"0.1.0"`) are placeholders and do not get bumped during releases.
- Deployments (such as the documentation site) are triggered via Git hooks / CI/CD configurations rather than pnpm/npm publish tasks.
