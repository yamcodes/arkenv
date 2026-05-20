---
name: creating-changesets
description: "Creates changesets for semantic versioning. Use when adding changesets, preparing releases, determining version bumps (patch/minor/major), generating changelog entries, or documenting breaking changes."
allowed-tools: "Read, Grep, Glob, Write, Edit, Bash(git:*), Bash(npx changeset:*)"
metadata:
  author: Ollie Shop
  version: 1.0.0
  internal: true
compatibility: "Claude Code with Node.js >=20, pnpm, TypeScript 5.5+"
---

# Changeset & Release Manager

## Overview

Automate the creation of changesets following project conventions, ensuring proper version bumps and well-documented release notes.

## When to Use

- After completing a feature or fix
- Before creating a PR
- When preparing a release
- To document breaking changes

## What is a Changeset?

A changeset is a markdown file in the `.changeset/` directory that describes:

1. Which packages are affected
2. What type of version bump (patch/minor/major)
3. A description of the change

## Changeset Types

Under standard Changesets behavior for pre-1.0.0 (`v0`) packages, version bumps are mapped down one level to respect the instability of pre-1.0.0 SemVer (where the second digit is the breaking release/major-equivalent indicator).

| Changeset Type | When to Use | v0 Version Bump (e.g., from `0.0.10` or `0.11.0`) | v1+ Version Bump |
| :--- | :--- | :--- | :--- |
| `patch` | Bug fixes, refactoring, dependency updates | Bumps **Patch** (`0.0.10` → `0.0.11` / `0.11.0` → `0.11.1`) | `1.0.0` → `1.0.1` |
| `minor` | New features, non-breaking API additions | Bumps **Patch** (`0.0.10` → `0.0.11` / `0.11.0` → `0.11.1`) | `1.0.0` → `1.1.0` |
| `major` | **Breaking changes** (in v0) or v1 transition | Bumps **Minor** (`0.0.10` → `0.1.0` / `0.11.0` → `0.12.0`) | `1.0.0` → `2.0.0` |

## Decision Guide (v0 Rules)

Most packages in this repo are currently in **v0** (0.x.y). For these packages:

### Use `patch` for:

- Bug fixes that don't change behavior
- Dependency updates (non-breaking)
- Performance improvements
- Code style/linting fixes

**Note**: Purely internal refactorings (e.g., library switches, internal type cleanup) that offer no tangible benefit or change to the consumer should NOT be documented in a changeset. Do not clutter the changelog with changes that are meaningless to the end user.

### Use `minor` for:

- New features (adds backward-compatible functionality)
- New CLI commands (backward-compatible)
- New configuration options (optional)
- Non-breaking API additions

*Note: In Changesets, for a v0 package, a `minor` bump will result in a patch version increase (e.g., `0.0.10` → `0.0.11`). This is expected behavior.*

### Use `major` for:

- **Breaking changes** (Required in v0 for any breaking modification to bump the minor version, e.g. `0.0.10` → `0.1.0` or `0.11.0` → `0.12.0`).
- Transitioning the project from `0.x.y` to `1.0.0`.

## What is a Breaking Change for a CLI?

To determine if a CLI change is a breaking change (requiring a `major` changeset bump in v0 to increment the minor version):

### Breaking (Requires `major` in v0):
- **Removing** or **renaming** an existing command, subcommand, or option/flag.
- Changing a parameter from **optional to required**.
- Changing a parameter's **data type** (e.g. changing `--foo` from a boolean flag to requiring a string).
- Changing **exit codes** that scripts might rely on for flow control.
- Changing **stdout/stderr output formats** in a way that breaks programmatic parsing (e.g., altering JSON structure).
- Bumping **minimum engine requirements** (e.g. dropping support for Node.js 18).

### Non-Breaking / Features (Use `minor` in v0):
- Adding **new commands** or subcommands.
- Adding **new optional options or flags**.
- Enhancing interactive prompt interfaces (as long as non-interactive fallback flags remain intact).
- Fixing logs, spelling, or messages.

## Creating a Changeset

### Title Convention

**IMPORTANT**: All changeset descriptions MUST start with a `####` header.

### Usage Examples

Always include usage examples or code snippets when adding new features or fixing bugs that affect how the library is used.

### Interactive Method

```bash
pnpm changeset
```

Follow the prompts:

1. Select affected packages (space to select)
2. Choose bump type for each package
3. Write a summary of changes (remember to start with `####`)

### Manual Method

Create a file in `.changeset/` with a random name:

````markdown
---
"arkenv": minor
---

#### Add `createEnv` helper for improved type inference

Usage:

```ts
import { createEnv } from "arkenv"
import { type } from "arktype"

export const env = createEnv({
  schema: {
    NODE_ENV: type("'development' | 'production' | 'test'"),
    PORT: type.number.parseable()
  }
})
```
````

### File Format

```markdown
---
"package-name": patch|minor
---

#### Short title of the change

Detailed description of the change.

Include:
- **Usage examples** (code blocks)
- Bullet points for details
- Migration instructions for breaking changes (using `minor` bump and `**BREAKING CHANGE**:` prefix)

**Note**: Do NOT reference GitHub issues (e.g., #123) directly in the changeset. Changesets will automatically be linked to the PR and commits during the release process.
```

## Release Workflow

### 1. Create Changeset

```bash
pnpm changeset
git add .changeset/
git commit -m "chore: add changeset for feature"
```

### 2. PR and Review

- Changeset is part of the PR
- Reviewers can suggest bump type changes

### 3. Merge to Main

- Changesets action creates "Version Packages" PR
- This PR updates version and CHANGELOG

### 4. Merge Version PR

- Triggers npm publish
- Creates GitHub release

## Checking Status

```bash
# See what changesets exist
npx changeset status

# Preview version bump
npx changeset version --dry-run
```

## Common Mistakes

| Mistake               | Issue               | Fix                                              |
| --------------------- | ------------------- | ------------------------------------------------ |
| Wrong bump type       | Unexpected version  | Review decision guide above                      |
| Vague description     | Poor CHANGELOG      | Be specific about changes                        |
| Missing changeset     | No release notes    | Always add before PR                             |
| Not including context | Hard to understand  | Explain *why* not just *what*                    |
| Meaningless changes   | Cluttered CHANGELOG | Only document changes with consumer value        |
| Including issue links | Redundant data      | Remove # references; PR links them automatically |

## Common Scenarios

For detailed examples of common scenarios including:

- Bug fixes, new features, breaking changes
- Multiple related changes
- Pre-release versions
- Best practices for descriptions

See **[Scenarios & Examples](references/scenarios.md)**

## References

- `{baseDir}/.changeset/config.json` - Changeset configuration
- `{baseDir}/CHANGELOG.md` - Generated changelog
- Changesets docs: [https://github.com/changesets/changesets](https://github.com/changesets/changesets)

## Related Skills

- **CI/CD automation**: See `managing-github-ci` for release workflow integration
- **Pre-commit validation**: See `validating-pre-commit` for quality gates before committing
