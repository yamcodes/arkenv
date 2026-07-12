# Forward-port reference

## Branch model

| Branch | Role | npm tag |
|--------|------|---------|
| `dev` | v0 maintenance — features and fixes land here first | `latest` |
| `v1` | Upcoming breaking release — long-lived alpha branch | `next` (pre-release) |
| `main` | Production docs; fast-forwarded from `dev` after publish | — |

Workflow source: `docs/CONTRIBUTING.md` Use Case 4.

## Package path map (dev → v1)

The biggest structural difference: on **dev**, the CLI and core library are separate packages. On **v1**, they swap names — `packages/arkenv` is the CLI and the core library moves to `packages/core`.

| Concern | dev (v0) path | dev npm name | v1 path | v1 npm name |
|---------|---------------|--------------|---------|-------------|
| CLI | `packages/cli/src/` | `@arkenv/cli` | `packages/arkenv/src/` | `arkenv` |
| Core runtime | `packages/arkenv/src/` | `arkenv` | `packages/core/src/` | `@arkenv/core` |
| Build tooling | `packages/build/` | `@arkenv/build` | `packages/build/` | `@arkenv/build` |
| Next.js | `packages/nextjs/` | `@arkenv/nextjs` | `packages/nextjs/` | `@arkenv/nextjs` |
| Nuxt | `packages/nuxt/` | `@arkenv/nuxt` | `packages/nuxt/` | `@arkenv/nuxt` |
| Vite plugin | `packages/vite-plugin/` | `@arkenv/vite-plugin` | `packages/vite-plugin/` | `@arkenv/vite-plugin` |
| Bun plugin | `packages/bun-plugin/` | `@arkenv/bun-plugin` | `packages/bun-plugin/` | `@arkenv/bun-plugin` |
| Standard mode | `packages/standard/` | `@arkenv/standard` | `packages/standard/` | `@arkenv/standard` |
| Internal utils | `packages/internal/` | `@arkenv/internal` | `packages/internal/` | `@arkenv/internal` |

**Absent on v1:** `packages/cli/` — all CLI code lives under `packages/arkenv/src/`.

### CLI subpath hints (dev → v1)

| dev | v1 |
|-----|-----|
| `packages/cli/src/features/scaffold/` | `packages/arkenv/src/features/scaffold/` |
| `packages/cli/src/cli/` | `packages/arkenv/src/cli/` |
| `packages/cli/src/adapters/` | `packages/arkenv/src/adapters/` |

## Changeset frontmatter map

When copying a dev changeset to v1, rename keys:

| dev changeset key | v1 changeset key |
|-------------------|------------------|
| `"@arkenv/cli"` | `"arkenv"` |
| `"arkenv"` (core lib) | `"@arkenv/core"` |
| `"@arkenv/nextjs"` | `"@arkenv/nextjs"` (unchanged) |
| `"@arkenv/nuxt"` | `"@arkenv/nuxt"` (unchanged) |
| `"@arkenv/build"` | `"@arkenv/build"` (unchanged) |

Example:

```markdown
---
"@arkenv/cli": patch
"arkenv": patch
"@arkenv/nuxt": patch
---
```

becomes on v1:

```markdown
---
"arkenv": patch
"@arkenv/core": patch
"@arkenv/nuxt": patch
---
```

## v1-only state to preserve

When forward-porting, do **not** revert v1 decisions already merged:

- Framework `./shared` exports removed — use `import { type } from "arkenv"` / `@arkenv/core`
- Core library split into `@arkenv/core`; CLI published as `arkenv`
- Logging helpers may live in different packages than on dev (check latest v1 before porting)
- Pre-release versioning (`1.0.0-alpha.x`) and `next` npm tag

Always read the current v1 tree before porting — v1-only refactors land independently of dev.

## Issue triage: v0 vs v1

| Signal | Target branch |
|--------|---------------|
| Backward-compatible feature/fix | `dev` → forward-port to `v1` |
| Title prefixed `(v1)` | `v1` only |
| Breaking export/API removal | `v1` only |
| "Blocked on v1 launch" / v1 branch README | `v1` only |
| "Forward-port from dev" / reconcile v0 features | `v1` (porting task) |
| Cross-cutting new public API (e.g. injectable logger) | `v1` only |

## Example ports

### CLI scaffold fix (#1281, #1282 → #1290)

Dev PRs fixed `.env` generation and pnpm `onlyBuiltDependencies` in `packages/cli/src/features/scaffold/`. v1 port re-implemented the same logic under `packages/arkenv/src/features/scaffold/`, updated tests, and renamed the changeset from `"cli"` to `"arkenv"`.

### Nuxt flat layout (#1248, #1256 → #1298, #1299)

Dev added flat layout to Nuxt. v1 already had partial support; the port adapted module, build layout resolution, CLI wizard, docs, and examples without merging dev wholesale. PR #1299 targeted `v1` with title `fix: Forward-port flat layout from dev to v1 branch`.

## Discover candidates

Run when the user asks to forward-port without naming a target:

```bash
# Recently merged dev PRs (newest first)
gh pr list --base dev --state merged --limit 15 \
  --json number,title,mergedAt,files \
  --jq '.[] | select(.files | any(.path | startswith("packages/"))) | {number, title, mergedAt}'

# Check if a dev PR was already forward-ported to v1
gh pr list --base v1 --search "Ports dev PR #1234" --state all
gh pr list --base v1 --search "Forward-port" --state merged --limit 20
```

**Good candidates:** merged dev PRs changing `packages/*`, with a changeset, not yet referenced by a v1 forward-port PR.

**Exclude:** docs-only www changes, `(v1)`-only work, dev-only structural changes, PRs whose v1 port already exists.

## Commands cheat sheet

```bash
# Compare a file across branches
git show dev:packages/cli/src/features/scaffold/planner.ts
git show origin/v1:packages/arkenv/src/features/scaffold/planner.ts

# List files changed in a merged dev PR
gh pr view <n> --json files --jq '.files[].path'

# Check v1 package layout
git ls-tree --name-only origin/v1:packages/

# Changeset status on v1 branch
git checkout v1 && npx changeset status
```
