---
name: create-changeset
description: "Creates changesets for semantic versioning. Use when adding changesets, preparing releases, determining version bumps (patch/minor/major), generating changelog entries, or documenting breaking changes."
allowed-tools: "Read, Grep, Glob, Write, Edit, Bash(git:*), Bash(npx changeset:*)"
metadata:
  author: Ollie Shop
  version: 1.0.0
  internal: true
compatibility: "Claude Code with Node.js >=20, pnpm, TypeScript 5.5+"
---

# Changeset & release manager

## Overview

Automate the creation of changesets following project conventions, ensuring proper version bumps and well-documented release notes.

## When to use

- After completing a feature or fix
- Before creating a PR
- When preparing a release
- To document breaking changes

## What is a changeset?

A changeset is a markdown file in the `.changeset/` directory that describes:

1. Which packages are affected
2. What type of version bump (patch/minor/major)
3. A description of the change

## Changeset types

| Type    | When to Use                                | v0 Version Change (Current) | v1+ Version Change |
| ------- | ------------------------------------------ | --------------------------- | ------------------ |
| `patch` | Bug fixes, non-breaking features, changes  | 0.y.z → 0.y.(z+1)           | 1.y.z → 1.y.z+1      |
| `minor` | **Breaking changes** (in v0)               | 0.y.z → 0.(y+1).0           | 1.y.z → 1.y+1.0      |
| `major` | **Avoid in v0** (explicit instruction only)| 0.y.z → 1.0.0               | 1.y.z → 2.0.0      |

## Decision guide (v0 rules)

Most packages in this repo are currently in **v0** (0.y.z). For these packages:

### Use `patch` for:

- Bug fixes
- New features and non-breaking changes
- Performance improvements
- Dependency updates
- Code style/linting fixes

**Note**: Purely internal refactorings (e.g., library switches, internal type cleanup) that offer no tangible benefit or change to the consumer should NOT be documented in a changeset. Do not clutter the changelog with changes that are meaningless to the end user.

### Use `minor` for:

- **Breaking changes** (Required in v0 for any breaking modification)

### Use `major` ONLY for:

- Explicitly transitioning the project from v0.y.z to v1.0.0, and **only upon explicit instruction** from the user. Do not use major for breaking changes in v0.

## Creating a changeset

### Title convention

**IMPORTANT**: All changeset descriptions MUST start with a `####` header.

### Usage examples

Always include usage examples or code snippets when adding new features or fixing bugs that affect how the library is used.

### Interactive method

```bash
pnpm changeset
```

Follow the prompts:

1. Select affected packages (space to select)
2. Choose bump type for each package
3. Write a summary of changes (remember to start with `####`)

### Manual method

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

### File format

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

## Release workflow

### 1. Create changeset

```bash
pnpm changeset
git add .changeset/
git commit -m "chore: add changeset for feature"
```

### 2. Pr and review

- Changeset is part of the PR
- Reviewers can suggest bump type changes

### 3. Merge to main

- Changesets action creates "Version Packages" PR
- This PR updates version and CHANGELOG

### 4. Merge version pr

- Triggers npm publish
- Creates GitHub release

## Checking status

```bash
# See what changesets exist
npx changeset status

# Preview version bump
npx changeset version --dry-run
```

## Common mistakes

| Mistake               | Issue               | Fix                                              |
| --------------------- | ------------------- | ------------------------------------------------ |
| Wrong bump type       | Unexpected version  | Review decision guide above                      |
| Vague description     | Poor CHANGELOG      | Be specific about changes                        |
| Missing changeset     | No release notes    | Always add before PR                             |
| Not including context | Hard to understand  | Explain *why* not just *what*                    |
| Meaningless changes   | Cluttered CHANGELOG | Only document changes with consumer value        |
| Including issue links | Redundant data      | Remove # references; PR links them automatically |

## Common scenarios

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

## Related skills

- **CI/CD automation**: See `managing-github-ci` for release workflow integration
- **Pre-commit validation**: See `validating-pre-commit` for quality gates before committing
