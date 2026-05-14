# Changeset Scenarios & Examples

## Bug Fix

```markdown
---
"arkenv": patch
---

#### Fix category parent reference not being set during deployment

Categories with parent slugs now correctly link to their parent categories during the deploy operation.
```

## New Feature

````markdown
---
"arkenv": minor
---

#### Add `createEnv` for type-safe environment variables

The new `createEnv` function allows you to define your environment schema using ArkType.

Usage:

```ts
import { createEnv } from "arkenv"
import { type } from "arktype"

const env = createEnv({
  schema: {
    PORT: type.number.parseable()
  }
})

console.log(env.PORT) // number
```
````

## Breaking Change (v0)

````markdown
---
"arkenv": minor
---

#### Change configuration format for validators

**BREAKING**: Validator options are now passed as a second argument to `createEnv`.

Before:
```ts
createEnv({ schema, strict: true })
```

After:
```ts
createEnv({ schema }, { strict: true })
```

Migration: Update your `createEnv` calls to separate the options from the schema configuration.
````

## Multiple Related Changes

```markdown
---
"arkenv": minor
---

#### Improve deployment reliability and progress reporting

- Add retry logic for failed operations
- Display progress bar during bulk operations
- Report partial failures at the end
- Add `--continue-on-error` flag to proceed despite failures
```

## Documentation Update

```markdown
---
"arkenv": patch
---

#### Update README with new installation instructions

Added documentation for Bun and Vite plugins, including setup examples and best practices.
```

## Analyzing Changes for Bump Type

### Check git diff

```bash
# See what changed since last release
git log --oneline main..HEAD

# See detailed changes
git diff main..HEAD -- src/
```

### Key Questions (v0 Context)

1. **Did the public API change?**
   - CLI commands modified → minor
   - Configuration schema changed → patch/minor
   - New features added → minor

2. **Could this break existing users?**
   - Yes → minor (Breaking changes in v0 are minor bumps)
   - No → patch

3. **Is this user-facing?**
   - Yes, new capability → minor
   - Yes, improved existing → patch
   - No, internal only → patch

## Consolidating Changesets

```bash
# View pending changesets
ls .changeset/

# Manually consolidate by:
# 1. Reading all changeset files
# 2. Creating a single comprehensive changeset
# 3. Deleting the individual files
```

## Pre-Release Versions

For beta/alpha releases:

```bash
# Enter pre-release mode
npx changeset pre enter beta

# Create changesets as normal
pnpm changeset

# Exit pre-release mode
npx changeset pre exit
```
