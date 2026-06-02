# Changeset scenarios & examples

## Bug fix

```markdown
---
"arkenv": patch
---

#### Fix category parent reference not being set during deployment

Categories with parent slugs now correctly link to their parent categories during the deploy operation.
```

## New feature (non-breaking, v0)

````markdown
---
"arkenv": patch
---

#### Add `arkenv` for type-safe environment variables

The new `arkenv` function allows you to define your environment schema using ArkType.

Usage:

```ts
import arkenv from "arkenv"
import { type } from "arktype"

const env = arkenv({
  schema: {
    PORT: type.number.parseable()
  }
})

console.log(env.PORT) // number
```
````

## Breaking change (v0)

````markdown
---
"arkenv": minor
---

#### Change configuration format for validators

**BREAKING CHANGE**: Validator options are now passed as a second argument to `arkenv`.

Before:
```ts
arkenv({ schema, strict: true })
```

After:
```ts
arkenv({ schema }, { strict: true })
```

Migration: Update your `arkenv` calls to separate the options from the schema configuration.
````

## Multiple related changes

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

## Analyzing changes for bump type

### Check Git diff

```bash
# See what changed since last release
git log --oneline main..HEAD

# See detailed changes
git diff main..HEAD -- src/
```

### Key questions (v0 context)

1. **Did the public API change?**
   - CLI commands modified → patch (if backward-compatible), minor (if breaking)
   - Configuration schema changed → patch (additive/non-breaking), minor (breaking)
   - New features added → patch (non-breaking), minor (breaking)

2. **Could this break existing users?**
   - Yes → minor (Breaking changes in v0 are minor bumps)
   - No → patch

3. **Is this user-facing?**
   - Yes, new capability → patch (non-breaking), minor (breaking)
   - Yes, improved existing → patch
   - No, internal only → patch

## Pre-release versions

For beta/alpha releases:

```bash
# Enter pre-release mode
npx changeset pre enter beta

# Create changesets as normal
pnpm changeset

# Exit pre-release mode
npx changeset pre exit
```
