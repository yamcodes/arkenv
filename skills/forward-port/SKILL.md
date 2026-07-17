---
name: forward-port
description: Manually forward-ports merged dev (v0) changes to the v1 branch, adapting code to v1's package layout and changeset names. Use when a dev PR is merged and needs v1 parity, when triaging "(v1)" reconciliation issues, or when the user mentions forward-porting, dual-tracking, or dev-to-v1 porting.
metadata:
  internal: true
---

# Forward-port (dev → v1)

ArkEnv runs **dual-tracking**: non-breaking work lands on `dev` (v0) first, then is manually adapted onto `v1`. Never merge `dev` into `v1` wholesale - structural differences cause severe tree conflicts.

See [REFERENCE.md](REFERENCE.md) for the full path/package map, changeset rename table, and real port examples.

## When to forward-port

Forward-port after a **merged dev PR** that fixes a bug, adds a non-breaking feature, or updates shared integrations.

**Skip forward-porting** when work is `(v1)`-only, introduces dev-only structure, or should be implemented natively on `v1`.

## Quick start

```bash
gh pr view <number> --json title,mergeCommit,files
git fetch origin v1 && git checkout -b forward-port/<name> origin/v1
# adapt changes (workflow below)
pnpm run typecheck && pnpm run test
gh pr create --base v1 --title "fix: Forward-port <summary> from dev"
```

## Workflow

### 0. Pick what to port (if not specified)

If the user did **not** name a PR, issue, or commit, **stop and ask** before writing code.

1. Discover candidates - recently merged dev PRs that touch published packages and likely need v1 parity (see [REFERENCE.md - discovery commands](REFERENCE.md#discover-candidates)).
2. Filter out PRs already forward-ported (v1 PR title/body mentions the dev PR, or commit message contains `Forward-port`).
3. Present **multiple choice** via `AskQuestion` with up to 4 candidates. Label each option as `#1234 - short title (packages touched)`.
4. Always include **"Other - I'll specify"** as the last option so the user can paste a PR/issue number.
5. If no candidates remain, say so and ask whether to port a specific PR/issue the user has in mind.

Do **not** guess or auto-pick when multiple candidates exist.

### 1. Gather source context

Read the merged dev PR: files, tests, changeset, linked issue. Note **behavior** - re-implement, don't blind cherry-pick. Map each touched package using [REFERENCE.md](REFERENCE.md).

### 2. Adapt the implementation

Key path map:

| dev | v1 |
|-----|-----|
| `packages/cli/src/**` | `packages/arkenv/src/**` |
| `packages/arkenv/src/**` (core) | `packages/core/src/**` |
| `nextjs`, `nuxt`, `build`, … | Same paths - verify imports |

Checklist:

- [ ] Fix imports (`@arkenv/cli` → `arkenv`, core → `@arkenv/core`)
- [ ] Port tests and docs/examples if the dev PR touched them
- [ ] Preserve v1-only decisions already on the branch (see REFERENCE)

### 3. Port the changeset

Rename frontmatter keys: `"@arkenv/cli"` → `"arkenv"`, `"arkenv"` (core) → `"@arkenv/core"`. Follow the [changeset skill](../changeset/SKILL.md).

### 4. Verify and open PR

Run `pnpm run typecheck`, `pnpm run test`, and package-scoped tests if localized. Open PR **targeting `v1`**, link the dev PR and tracking issue.

## Acceptance checklist

- [ ] Behavior matches merged dev PR
- [ ] No dev-only paths or imports remain
- [ ] Changeset uses v1 package names
- [ ] Tests pass on v1 branch

## Common mistakes

| Mistake | Fix |
|---------|-----|
| `git merge dev` into `v1` | Feature-driven manual port |
| Blind cherry-pick | Re-implement at v1 paths |
| `"cli"` in v1 changeset | Rename to `"arkenv"` |
| Core change in `packages/arkenv/` on v1 | Core is `packages/core/` |

## Related

- [REFERENCE.md](REFERENCE.md) - path map, changeset table, examples
- [changeset skill](../changeset/SKILL.md)
- [CONTRIBUTING.md Use Case 4](../../../docs/CONTRIBUTING.md)
