---
name: changeset
description: Creates changesets for semantic versioning. Use when adding changesets, preparing releases, determining version bumps (patch/minor/major), generating changelog entries, or documenting breaking changes.
metadata:
  author: Yam C Borodetsky
  original_author: Ollie Shop
  origin: github.com/ollieshop/creating-changesets
  version: 1.0.0
  internal: true
---

# Changeset & release manager

## Overview

Automate the creation and modification of changesets following project conventions, ensuring proper version bumps and well-documented release notes.

## When to use

- After completing a feature or fix
- Before creating a PR
- When updating or correcting an existing changeset
- When preparing a release
- To document breaking changes

## What is a changeset?

A changeset is a markdown file in the `.changeset/` directory that describes:

1. Which packages are affected
2. What type of version bump (patch/minor/major)
3. A description of the change

## Changeset types

The **"When to Use"** rule depends on whether the package is still in v0 (`0.y.z`) or has reached v1+. v0 packages use a non-standard convention (`minor` is reserved for breaking changes); v1+ packages follow **standard SemVer**.

| Type    | When to Use in v0 (default)               | When to Use in v1+ (standard SemVer) |
| ------- | ----------------------------------------- | ------------------------------------ |
| `patch` | Any non-breaking change (fixes, features) | Non-breaking bug fixes               |
| `minor` | **Breaking changes**                      | Non-breaking new features            |
| `major` | Switch to v1 (only when instructed)       | **Breaking changes**                 |

> **Forward-porting note:** the `dev` branch ships **v0** packages (e.g. `@arkenv/cli`), but the `v1` branch ships **v1+** packages (e.g. `arkenv`, `@arkenv/core`) in prerelease. A change that is `patch` on `dev` (a new feature) is usually `minor` when forward-ported to `v1`. Never blindly copy the bump type across branches.

## Decision guide

### v1+ packages (standard SemVer)

Applies to packages at `1.0.0` or higher, including the `v1` branch's prerelease packages (`arkenv`, `@arkenv/core`, `@arkenv/standard`, …).

- **`patch`** - non-breaking bug fixes, dependency updates, performance improvements, small doc corrections.
- **`minor`** - **new features** (new CLI commands/options, enhanced functionality, non-breaking API/exports additions).
- **`major`** - **breaking changes** (require consumers to change code). Include a `**BREAKING CHANGE**:` note with migration instructions.

### v0 packages (legacy convention)

Most packages on the `dev` branch are still in **v0** (0.y.z). For these packages:

#### Use `patch` for:

- **Any non-breaking change** (including new features, new CLI commands, new configuration options, enhanced functionality, non-breaking API additions, etc.)
- Bug fixes
- Dependency updates (non-breaking)
- Performance improvements
- Dependency updates
- Code style/linting fixes

**Note**: Purely internal refactorings (e.g., library switches, internal type cleanup) that offer no tangible benefit or change to the consumer should NOT be documented in a changeset. Do not clutter the changelog with changes that are meaningless to the end user.

#### Use `minor` ONLY for:

- **Breaking changes** (Required in v0 for any breaking modification. You MUST prefix the description with `**BREAKING CHANGE**:`).

#### Use `major` ONLY for:

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
"arkenv": patch
---

#### Add `arkenv` helper for improved type inference

Usage:

```ts
import arkenv from "arkenv"
import { type } from "arktype"

export const env = arkenv({
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

## Modifying an existing changeset

### When to modify

- The bump type is wrong (e.g., used `minor` for a patch-level change)
- The description uses past or indicative tense instead of imperative mood
- Usage examples are missing or incorrect
- The changeset references GitHub issues directly
- A change is documented that should be excluded (internal-only refactoring with no consumer value)
- Multiple related changes exist across separate changesets that should be combined

### Process

1. **Read** the existing changeset file from `.changeset/`
2. **Assess** what needs to change: bump type, description, examples, or scope
3. **Edit** the file directly - changesets are plain markdown files
4. **Remove** the file entirely if the changeset no longer applies (e.g., the change was reverted)

### Validation checklist after modification

- [ ] Bump type matches the decision guide (patch for non-breaking, minor for breaking)
- [ ] Title starts with `####` header
- [ ] All descriptions use imperative mood (no past tense, no indicative)
- [ ] Usage examples present for user-facing changes
- [ ] No GitHub issue references (# numbers)
- [ ] Breaking changes have `**BREAKING CHANGE**:` prefix

## Release workflow

### 1. Create or modify changeset

```bash
# Create
pnpm changeset

# Or modify manually
# Edit .changeset/<name>.md directly
```

### 2. PR and review

- Changeset is part of the feature PR targeting the `dev` branch
- Reviewers can suggest bump type changes or edits

### 3. Merge to dev

- Merging a feature PR containing a changeset to `dev` triggers the Changesets GitHub Action
- The action automatically creates or updates a "Version Packages" PR targeting the `dev` branch (since `baseBranch` is set to `dev` in `.changeset/config.json`)
- This "Version Packages" PR contains all accumulated version updates and CHANGELOG entries

### 4. Merge version PR

- Merging the "Version Packages" PR on `dev` triggers the publication of bumped packages to npm
- Upon successful publish, the release workflow programmatically fast-forwards the `main` branch to `dev` (`git merge dev --ff-only`) and pushes it
- The push to `main` triggers the production documentation website deployment

## Checking status

```bash
# See what changesets exist
npx changeset status

# Preview version bump
npx changeset version --dry-run

# List all changeset files
ls .changeset/*.md
```

## Common mistakes

| Mistake               | Issue               | Fix                                              |
| --------------------- | ------------------- | ------------------------------------------------ |
| Wrong bump type       | Unexpected version  | Review decision guide above                      |
| Vague description     | Poor CHANGELOG      | Be specific about changes                        |
| Missing changeset     | No release notes    | Always add before PR                             |
| Past tense in body    | Style violation     | Rewrite in imperative mood                       |
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

- [config.json](file:///.changeset/config.json) - Changeset configuration
- [CHANGELOG.md](file:///CHANGELOG.md) - Generated changelog
- Changesets docs: [https://github.com/changesets/changesets](https://github.com/changesets/changesets)

## Related skills

- **GitHub CLI**: See [gh-cli](../gh-cli/SKILL.md) for GitHub-related tasks.
- **Tackle Issue**: See [tackle-issue](../tackle-issue/SKILL.md) for the workflow of addressing issues.

## Credits

This skill was originally created by [Ollie Shop](https://github.com/ollieshop) and sourced from [github.com/ollieshop/creating-changesets](https://github.com/ollieshop/creating-changesets).
