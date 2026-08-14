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

Write the changelog the **package consumer** will read on npm and GitHub Releases. Automate version bumps, but treat the markdown body as product copy: someone who never opened this repo should understand what changed and what to do.

A good changeset answers:

1. Which packages are affected
2. What type of version bump (`patch` / `minor` / `major`)
3. What the reader will notice, and how to migrate if anything broke

Do not write for the PR reviewer. Skip implementation details, ADRs, and internal type names unless the reader needs them to update their app.

## When to use

- After completing a feature or fix
- Before creating a PR
- When updating or correcting an existing changeset
- When preparing a release
- To document breaking changes

## Changeset types

| Type    | When to Use in v0 (Current)               | When to Use in v1+                       |
| ------- | ----------------------------------------- | ----------------------------------------- |
| `patch` | Any non-breaking change (fixes, features) | Non-breaking bug fixes                    |
| `minor` | **Breaking changes**                      | Non-breaking new features                 |
| `major` | Switch to v1 (only when instructed)       | **Breaking changes**                      |

\* In v0, `minor` is used for **breaking changes**, not features.
\*\* In v0, `major` is used only when explicitly transitioning to v1.

## Decision guide

> **Current Status:** The ArkEnv monorepo is in **v1 prerelease mode** (alpha). All packages follow **standard SemVer (v1+ rules)**.

### Use `patch` for:

- Bug fixes
- Dependency updates (non-breaking)
- Performance improvements
- Code style/linting fixes
- Small documentation corrections

### Use `minor` for:

- **New features** (new CLI commands, new configuration options, enhanced functionality, non-breaking API additions, etc.)
- New exports or public APIs
- Significant documentation improvements

### Use `major` for:

- **Breaking changes** (any modification that requires consumers to change their code). You MUST include a `**BREAKING CHANGE**:` note at the bottom of the changeset with migration instructions.

**Note**: Purely internal refactorings (e.g., library switches, internal type cleanup) that offer no tangible benefit or change to the consumer should NOT be documented in a changeset. Do not clutter the changelog with changes that are meaningless to the end user.

## v0 Rules (Legacy / Reference Only)

Use these rules only when working with packages still at `0.y.z` that are **not** in v1 prerelease mode:

### Use `patch` for:

- **Any non-breaking change** (including new features, bug fixes, dependency updates, performance improvements, etc.)

### Use `minor` ONLY for:

- **Breaking changes** (Required in v0 for any breaking modification. You MUST prefix the description with `**BREAKING CHANGE**:`).

### Use `major` ONLY for:

- Explicitly transitioning the project from v0.x.y to v1.0.0. **Only use major when explicitly instructed to switch/transition to v1.**

## Decision guide (v1+ rules)

For packages in **v1+** (e.g. active `v1` branch):

### Use `patch` for:
- Backward-compatible bug fixes
- Internal performance or refactor improvements with user value

### Use `minor` for:
- Backward-compatible new features or API additions

### Use `major` for:
- **Breaking changes** (Any change that breaks backward compatibility. You MUST prefix the description with `**BREAKING CHANGE**:`).

## Creating a changeset

### Voice: write for the unknowing consumer

The body is pasted into `CHANGELOG.md`. Assume the reader installed `@arkenv/nextjs` (or similar) and hit an error or API change. They do not know “boundary access”, “client graph”, or whether a throw is a native `Error`.

- **Lead with what they see or do** (console text, a new option, a renamed export).
- **Say why it matters** in one or two sentences (secret stayed off the client, build now fails closed, types match runtime).
- **Show before/after** with a snippet or `diff`. Do not paste the library’s internal throw helper unless they must call it.
- **Stay imperative** (`Fix`, `Add`, `Show`) and concrete. Friendly is not fluffy, and it is not a commit message.

Terse / insider (avoid):

> Brand boundary throws as `ArkEnvError` via `error.name`. `instanceof` stays validation-only.

Consumer-facing (prefer):

> If client code reads a server-only variable such as `DATABASE_URL`, the overlay now shows `ArkEnvError: Attempted to access…`. Fix the component. `instanceof ArkEnvError` still means startup validation failed and still has `.issues`.

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
"package-name": patch|minor|major
---

#### Imperative title of the change (e.g., "Add helper" - MUST be imperative mood)

What the reader will notice, then how to use or migrate. A short paragraph is better than a stack of insider nouns. Include a snippet or diff when behavior or APIs change.

Include:

- **What they see** (error text, new flag, renamed export)
- **Usage or before/after** (code blocks)
- **Migration** for breaking changes (major bump and a **BREAKING CHANGE**: note at the bottom)

**Note**: Do NOT reference GitHub issues (e.g., #123) directly in the changeset. Changesets will automatically be linked to the PR and commits during the release process.
**BREAKING CHANGE**: Place migration instructions at the **end**. Keep that footer to 1-3 lines plus an optional diff. Prefer showing old vs new strings or calls over explaining internals.
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

- [ ] Bump type matches the decision guide (patch/minor for non-breaking, major for breaking)
- [ ] Title starts with `####` header
- [ ] All descriptions use imperative mood (no past tense, no indicative)
- [ ] A newcomer could act on the note without reading the PR (what they see, what to do)
- [ ] Usage examples or before/after present for user-facing changes
- [ ] No GitHub issue references (# numbers)
- [ ] Breaking changes use `major` bump and include a `**BREAKING CHANGE**:` note at the bottom

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
- The push to `main` triggers the production documentation website

## Pre-release versions

For managing alpha, beta, and release candidate (rc) pre-releases, we follow a strict versioning policy using the `alpha` ➔ `beta` ➔ `rc` progression.

To avoid duplication, the exact pre-release branching strategies, command workflows, and SemVer naming rules are documented in the [Contributing Guide](file:///Users/yamcodes/code/arkenv/docs/CONTRIBUTING.md#use-case-4-coordinating-a-major-version-eg-v1).

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
| Vague description     | Poor CHANGELOG      | Be specific about what the reader will see       |
| Terse / insider jargon | Consumer cannot act | Rewrite for someone who never opened the repo    |
| Missing changeset     | No release notes    | Always add before PR                             |
| Past tense in body    | Style violation     | Rewrite in imperative mood                       |
| Not including context | Hard to understand  | Explain *why* it matters to the app, not the PR  |
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
