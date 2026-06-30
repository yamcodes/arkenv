# ADR 0006: Branching and Release Flow

## Status
Accepted

## Context
In our monorepo, we maintain several interdependent packages alongside our Next.js documentation site. We need a release flow that meets three specific requirements:

1. **Automated versioning**: Managing package versions manually across a monorepo is error-prone.
2. **Strict documentation sync**: The live production docs must only reflect features that have actually been released to npm (no "drift").
3. **Doc hotfixes**: We must be able to push typo and cosmetic fixes to the live docs immediately, without waiting for or triggering a full package release.

### Considered Alternatives
Based on our analysis of external open-source projects, we evaluated three primary architectures:

#### 1. Single-Branch + Accept Drift (e.g., TanStack, Fumadocs)
- **Mechanics**: Everything merges into a single branch (`main` or `dev`). Vercel deploys docs immediately on every commit. Packages are published periodically.
- **Trade-offs**: Simple to manage. However, it violates our strict documentation sync requirement. Users will read about features on the live site that aren't available on npm yet.

#### 2. Single-Branch + Continuous Canary (e.g., Zod, ArkType)
- **Mechanics**: Everything merges into `main`. An automated script instantly publishes a stable or `canary` release to npm on *every single commit*.
- **Trade-offs**: Solves the drift issue because the package is always released instantly. However, it requires a noisy continuous publishing pipeline and aggressive tagging that we prefer to avoid.

#### 3. Single-Branch + Automatic "Unreleased" Chips
- **Mechanics**: Use `git diff` during the Next.js build to compare `HEAD` against the last stable git tag. Automatically inject an `<Unreleased />` UI chip into the docs for any changed files.
- **Trade-offs**: A clever Application-layer fix that avoids branch complexity, but it is highly coupled to the build script and requires continuous maintenance of the frontend logic.

## Decision
We have decided to adopt a **Dual-Branch (`dev` / `main`) Model** using **Changesets** for package versioning.

1. **`dev`** is the default branch. Feature PRs merge here. Vercel Preview deployments run here, but production does not. All feature development, issue tackling, and comparisons (such as git diffs or branch bases) must target `dev` (`origin/dev`).
2. **Changesets** continuously aggregates version bumps into a "Version Packages" PR against `dev`. This solves the monorepo versioning problem.
3. When the Changesets PR is merged, the packages publish to npm, and a workflow fast-forwards **`main`** to match `dev`.
4. **`main`** is our production branch. The production documentation site strictly deploys from here.

To satisfy the third requirement (doc hotfixes without package releases), we are pairing this architecture with the `sync-main` workflow. If a typo needs fixing immediately, contributors can merge the fix directly into `main` (triggering a doc deploy) and the `sync-main` script will automatically cherry-pick and reconcile that commit back into `dev` to prevent Git history drift.

## Consequences
- **Strict Sync**: Unreleased features physically cannot hit the production docs because they are quarantined in `dev` until released.
- **Independent Doc Hotfixes**: Contributors can merge documentation-only hotfixes directly to `main` without triggering package releases, keeping docs accurate in real-time.
- **Clean Branch History**: The `sync-main` workflow automatically reconciles hotfixes back to `dev` to prevent Git history drift.
