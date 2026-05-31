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

| Type    | When to Use                               | v0 Version Change (Current) | v1+ Version Change |
| ------- | ----------------------------------------- | --------------------------- | ------------------ |
| `patch` | Any non-breaking change (fixes, features) | 0.0.1 → 0.0.2               | 1.0.0 → 1.0.1      |
| `minor` | **Breaking changes**                      | 0.0.1 → 0.1.0               | 1.0.0 → 1.1.0      |
| `major` | Switch to v1 (only when instructed)       | 0.0.1 → 1.0.0               | 1.0.0 → 2.0.0      |

## Decision guide (v0 rules)

Most packages in this repo are currently in **v0** (0.y.z). For these packages:

### Use `patch` for:

- **Any non-breaking change** (including new features, new CLI commands, new configuration options, enhanced functionality, non-breaking API additions, etc.)
- Bug fixes
- Dependency updates (non-breaking)
- Performance improvements
- Dependency updates
- Code style/linting fixes

**Note**: Purely internal refactorings (e.g., library switches, internal type cleanup) that offer no tangible benefit or change to the consumer should NOT be documented in a changeset. Do not clutter the changelog with changes that are meaningless to the end user.

### Use `minor` ONLY for:

- **Breaking changes** (Required in v0 for any breaking modification. You MUST prefix the description with `**BREAKING CHANGE**:`).

### Use `major` ONLY for:

- Explicitly transitioning the project from v0.x.y to v1.0.0. **Only use major when explicitly instructed to switch/transition to v1.** Do not use major for breaking changes in v0.

## Creating a changeset

### Title convention

- **Format**: All changeset descriptions MUST start with a `####` header.
- **Mood**: You MUST use the **imperative mood** for all headers, change summaries, and actions. Write changesets as commands to the codebase (e.g. "Add helper...", "Fix issue...", "Drop support..." instead of "Adds...", "Fixed...", "Drops..."). Any changeset using indicative ("Adds/fixes") or past tense ("Added/fixed") is strictly invalid.

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

#### Imperative title of the change (e.g., "Add helper" - MUST be imperative mood)

Detailed description of the change (also using imperative mood for action summaries).

Include:
- **Usage examples** (code blocks)
- Bullet points for details
- Migration instructions for breaking changes (using `minor` bump and you MUST include the `**BREAKING CHANGE**:` label)

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
