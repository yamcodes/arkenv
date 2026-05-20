# Tooling

This directory contains development and testing tools that are separate from the main packages.

## Purpose

The `tooling/` directory is designed for:

- **Development tools** that support the project but aren't published packages
- **Testing infrastructure** like Playwright test suites
- **Build tools** and utilities that don't belong in `packages/`
- **CI/CD helpers** and automation scripts

## Key Differences Across Directories

| Aspect              | `packages/`                                    | `apps/`                                                   | `tooling/`                                     |
| :------------------ | :--------------------------------------------- | :-------------------------------------------------------- | :--------------------------------------------- |
| **Purpose**         | Published npm libraries, plugins, or CLIs      | Private user-facing apps or local playgrounds             | Development, testing, and CI/CD infrastructure |
| **Changesets**      | ✅ Versioned and released                       | ❌ Ignored in releases                                     | ❌ Ignored in releases                          |
| **Publishing**      | ✅ Published to npm registry                    | ❌ Not published                                           | ❌ Not published                                |
| **Target Audience** | End-users consuming the NPM packages           | End-users browsing the docs or developers testing locally | Developers maintaining the monorepo            |
| **Examples**        | `arkenv`, `@arkenv/cli`, `@arkenv/vite-plugin` | `www` (Next.js docs), `playgrounds/*`                     | `playwright-www` (E2E tests)                   |

> [!NOTE]
> Even though `@arkenv/cli` is an executable command-line tool and not a programmatically-imported library, it resides under `packages/` because it is published to npm for end-users (e.g., via `npx @arkenv/cli`). In contrast, internal development scripts and test orchestrations live in `tooling/`.

## Structure

```
tooling/
├── playwright-www/          # E2E tests for www application
│   ├── tests/               # Playwright test files
│   ├── playwright.config.ts # Playwright configuration
│   └── package.json         # Test dependencies
└── README.md               # This file
```

## Why Separate from `packages/`?

1. **No Publishing**: These tools aren't meant to be published to npm
2. **Changeset Exclusion**: Tools don't need versioning or changelog entries
3. **Clear Separation**: Distinguishes between published code and development tools
4. **Dependency Management**: Tools can have different dependency requirements
5. **CI/CD Focus**: These are primarily for development and testing workflows

## Adding New Tools

When adding new tooling packages:

1. Create a new directory under `tooling/`
2. Add a `package.json` with appropriate dev dependencies
3. Update this README to document the new tool
4. Ensure the tool follows the same patterns as existing tools

## Examples

- **`playwright-www/`**: End-to-end testing for the www application
- **Future tools**: Linting configs, build scripts, deployment helpers, etc.

This separation keeps the project organized and ensures that only actual packages get versioned and published.
