# External Repositories Branching & Release Flow Report

This report analyzes the branching, package release, and documentation deployment workflows of the 9 external repositories cloned in the `repos/` folder. It maps their structures to the branching and release models described in [ADR 0006: Branching and Release Flow](./adr/0006-branching-and-release-flow.md).

---

## Executive Summary

The table below summarizes each repository's branching model, release automation, and how it aligns with the architectural models described in ADR 0006.

| Repository | Default Branch | Release Tooling | ADR 0006 Model Mapping | Key Flow Features |
| :--- | :--- | :--- | :--- | :--- |
| **[arktype](../repos/arktype)** | `main` | Custom scripts & GitHub CLI | **Model 3 Variant** (Trunk-Based, Custom Scripts) | Release triggered on push to `main`; custom TS script tags and publishes unreleased versions. |
| **[astro](../repos/astro)** | `main` | Changesets (`changesets/action`) | **Model 1 & 2 Hybrid** (Trunk-Based + Multi-branch Sync) | Uses changesets on `main`; publishes on push to `main` and automatically reconciles changes into `next` via an AI-assisted merge workflow. |
| **[fumadocs](../repos/fumadocs)** | `dev` | Changesets (`changesets/action`) | **Model 1** (Trunk-Based with Changesets) | Standard trunk-based changesets flow where the default branch is named `dev`. |
| **[query](../repos/query)** | `main` | Changesets (`changesets/action`) | **Model 1** (Trunk-Based with Changesets) | Changesets on `main` with support for publishing pre-release and maintenance branches (`v*`, `*-pre`, `*-maint`). |
| **[router](../repos/router)** | `main` | Changesets (`changesets/action`) | **Model 1** (Trunk-Based with Changesets) | Changesets on `main` with support for publishing pre-release and maintenance branches (`*-pre`, `*-maint`). |
| **[t3-env](../repos/t3-env)** | `main` | Changesets & Bun scripts | **Model 1** (Trunk-Based with Changesets) | Changesets on `main` running custom Bun versioning and publishing scripts. |
| **[trpc](../repos/trpc)** | `main` | Lerna (`lerna publish`) | **Model 3 Variant** (Trunk-Based, Continuous Canary) | Continuous canary publishes on every merge to `main`; stable releases triggered manually via `workflow_dispatch`. |
| **[turbo](../repos/turbo)** | `main` | Custom Node scripts & GitHub API | **Model 3 & 4 Hybrid** (Staging Branches + Tag Trigger) | Scheduled or manual version bumps generate a temporary `staging-[version]` branch. Success publishes to npm, tags the release, opens a PR to `main`, and auto-merges it. |
| **[zod](../repos/zod)** | `main` | `JS-DevTools/npm-publish` | **Model 3 & 4 Hybrid** (Version-Detection + Canary) | Push to `main` runs publish. If the version in `package.json` is new, it publishes a stable release; otherwise, it automatically publishes a canary. |

---

## Detailed Repository Profiles

### 1. ArkType
* **Default Branch**: `main`
* **Release Tooling**: Custom TypeScript script [`publish.ts`](../repos/arktype/ark/repo/publish.ts) and the GitHub CLI.
* **ADR 0006 Mapping**: **Model 3 Variant** (Trunk-Based with Custom Release Scripts).
* **Workflows Analyzed**: [`publish.yml`](../repos/arktype/.github/workflows/publish.yml)
* **How it Works**:
  1. Developers commit/merge PRs directly into `main`.
  2. Every push to `main` runs the `publish` workflow.
  3. The workflow builds the documentation site (`pnpm buildDocs`) and deploys it immediately to GitHub Pages.
  4. The workflow runs `pnpm ci:publish` which calls the `publish.ts` script. This script compares the package versions in `package.json` against existing repository git tags.
  5. If a version is new (meaning no tag matching `${pkgName}@${pkgVersion}` exists), the script tags the commit locally, publishes the package to npm (`pnpm publish --no-git-checks`), pushes git tags to GitHub, and creates a GitHub Release.
* **Documentation Flow**: Model 1/Model 3 style. Documentation is built from the default branch `main` and deployed to production on every push. There is no staging branch or out-of-sync delay since the custom publish script handles version checks inline.

### 2. Astro
* **Default Branch**: `main`
* **Release Tooling**: Changesets (`@changesets/cli` and `changesets/action`).
* **ADR 0006 Mapping**: **Model 1 & 2 Hybrid** (Trunk-Based Development with Changesets + Dual-Branch Sync).
* **Workflows Analyzed**: [`release.yml`](../repos/astro/.github/workflows/release.yml), [`merge-main-to-next.yml`](../repos/astro/.github/workflows/merge-main-to-next.yml)
* **How it Works**:
  1. Active development targets `main`.
  2. A push to `main` triggers `release.yml` which runs `changesets/action`.
  3. If changesets are present, the action opens/updates a `[ci] release` PR targeting `main`.
  4. Merging the release PR builds the packages, publishes them to npm, and creates the corresponding release tags.
  5. Once a release is published on `main`, a post-release event (`release-published`) is dispatched.
  6. This event triggers the `merge-main-to-next.yml` workflow, which merges `main` back into the `next` branch (used for the next major/minor version cycle). If merge conflicts occur, it uses a custom AI conflict-resolution runner (`flue`) to resolve conflicts and opens a pull request targeting `next`.
* **Documentation Flow**: Decoupled. The primary documentation website lives in a separate repository (`withastro/docs`), so the main monorepo does not deploy docs directly.

### 3. Fumadocs
* **Default Branch**: `dev`
* **Release Tooling**: Changesets (`@changesets/cli` and `changesets/action`).
* **ADR 0006 Mapping**: **Model 1** (Trunk-Based Development with Changesets).
* **Workflows Analyzed**: [`release.yml`](../repos/fumadocs/.github/workflows/release.yml)
* **How it Works**:
  1. The default development branch is named `dev`.
  2. Developers target PRs to `dev`.
  3. Pushes to `dev` run the `release.yml` workflow, which executes `changesets/action`.
  4. If changesets are present, the action opens or updates a "Version Packages" PR targeting `dev`.
  5. Merging this PR triggers the changeset action to run `pnpm run release` (which publishes built packages to npm).
* **Documentation Flow**: The documentation site is part of the monorepo and is deployed automatically via Vercel on commits to the default `dev` branch.

### 4. TanStack Query
* **Default Branch**: `main`
* **Release Tooling**: Changesets (`@changesets/cli` and `changesets/action`) along with custom release scripting.
* **ADR 0006 Mapping**: **Model 1** (Trunk-Based Development with Changesets).
* **Workflows Analyzed**: [`release.yml`](../repos/query/.github/workflows/release.yml)
* **How it Works**:
  1. Development primarily targets `main`.
  2. Pushes to `main`, `v[0-9]` (major branches), `*-pre` (pre-release branches), and `*-maint` (maintenance branches) trigger `release.yml`.
  3. The workflow uses `changesets/action` to open versioning PRs or publish.
  4. If a release is published, the script determines the appropriate npm tag (`pre`, `maint`, or standard `latest` depending on the branch name) and executes a custom script (`create-github-release.mjs`) to create the GitHub release.
* **Documentation Flow**: Decoupled. Documentation site is deployed from the default branch, but built and handled outside of this release pipeline.

### 5. TanStack Router
* **Default Branch**: `main`
* **Release Tooling**: Changesets (`@changesets/cli` and `changesets/action`) along with custom release scripting.
* **ADR 0006 Mapping**: **Model 1** (Trunk-Based Development with Changesets).
* **Workflows Analyzed**: [`release.yml`](../repos/router/.github/workflows/release.yml)
* **How it Works**:
  1. Development targets `main`.
  2. Pushes to `main`, `*-pre`, and `*-maint` trigger the `release.yml` workflow.
  3. The workflow handles entering pre-release mode automatically if the branch is `*-pre` (`changeset pre enter`).
  4. Uses `changesets/action` to version packages and publish to npm, followed by `create-github-release.mjs` to create the GitHub release.
* **Documentation Flow**: Decoupled.

### 6. t3-env
* **Default Branch**: `main`
* **Release Tooling**: Changesets (`@changesets/cli` and `changesets/action`) with custom Bun scripts.
* **ADR 0006 Mapping**: **Model 1** (Trunk-Based Development with Changesets).
* **Workflows Analyzed**: [`release.yml`](../repos/t3-env/.github/workflows/release.yml)
* **How it Works**:
  1. Active development targets `main`.
  2. Pushes to `main` run the `release.yml` workflow, which runs `changesets/action`.
  3. The changeset action is configured to run custom version and publish scripts: `bun run scripts/version.ts` and `bun run scripts/publish.ts`.
  4. If a versioning PR is opened, the workflow runs a post-version formatting step (`bun fmt`) on the staging branch `changeset-release/main` and pushes it back to the branch before the PR is finalized.
* **Documentation Flow**: Decoupled.

### 7. tRPC
* **Default Branch**: `main`
* **Release Tooling**: Lerna (`lerna publish`).
* **ADR 0006 Mapping**: **Model 3 Variant** (Trunk-Based Development, Continuous Canary + Manual Stable).
* **Workflows Analyzed**: [`release-manual.yml`](../repos/trpc/.github/workflows/release-manual.yml)
* **How it Works**:
  - **Canary Releases**: Every merge or push to `main` automatically triggers the `publish-canary` job, which runs `pnpm lerna publish --canary` to immediately publish pre-releases to npm under the `canary` tag.
  - **Stable Releases**: Stable releases are triggered manually by maintainers using `workflow_dispatch` on the `release-manual.yml` workflow. The maintainer inputs the version bump type (`patch` or `minor`) and npm tag (`latest`). The workflow then runs `pnpm lerna publish` to bump versions, create git tags, publish to npm, and push back to `main`.
* **Documentation Flow**: Decoupled. Documentation website is deployed via separate workflows/platforms.

### 8. Turborepo
* **Default Branch**: `main`
* **Release Tooling**: Custom Node scripts (`scripts/version.js`, `create-github-api-commit.mjs`) and GitHub API workflows.
* **ADR 0006 Mapping**: **Model 3 & 4 Hybrid** (Staging Branches with Tag-Triggered Actions and Auto-Merge).
* **Workflows Analyzed**: `turborepo-release.yml`
* **How it Works**:
  1. Active development targets `main`.
  2. Releases are scheduled hourly (canary cron) or triggered manually via `workflow_dispatch` with inputs for the SemVer increment.
  3. **Staging**: The workflow cuts a temporary branch `staging-[version]` from the target commit. This staging branch acts as a lock to prevent concurrent releases.
  4. **Build & Test**: The workflow builds Rust binaries, runs smoke tests, and packages JS modules on the staging branch.
  5. **Publish**: The workflow publishes the packages to npm.
  6. **Tagging**: Only after npm publishing succeeds does the workflow create and push the Git release tag (e.g. `v[version]`).
  7. **Auto-Merge**: The workflow bumps the main branch to the next development canary version (via `version.js`), commits the changes using the GitHub API, opens a Pull Request targeting `main`, and automatically merges it (`gh pr merge --auto --squash`).
  8. **Failure Recovery**: If any job fails, the staging branch and Git tag are automatically cleaned up and deleted to reset the state.
* **Documentation Flow**: The release pipeline includes an `alias-versioned-docs` job that automatically maps and aliases versioned docs (e.g., `v2-5-4.turborepo.dev`) during the release process.

### 9. Zod
* **Default Branch**: `main`
* **Release Tooling**: `JS-DevTools/npm-publish` and `mikepenz/release-changelog-builder-action`.
* **ADR 0006 Mapping**: **Model 3 & 4 Hybrid** (Version-Detection Release Publishing + Continuous Canary).
* **Workflows Analyzed**: [`release.yml`](../repos/zod/.github/workflows/release.yml)
* **How it Works**:
  1. Active development targets `main`.
  2. Merges and pushes to `main` that contain changes in `packages/zod/` trigger the `release.yml` workflow.
  3. The workflow runs the `JS-DevTools/npm-publish` action on the `packages/zod` folder.
  4. **Stable Release Trigger**: If the version in `packages/zod/package.json` is new (i.e. has not yet been published to npm), the action publishes the stable package to npm and JSR, generates a changelog, and creates a GitHub Release and tag `v[version]`.
  5. **Canary Release Trigger**: If the version in `package.json` is already published, the workflow automatically generates a canary version (e.g. `[version]-canary.[timestamp]`) and publishes it to npm under the `canary` tag.
* **Documentation Flow**: Built directly from the repository code. Canary publishes run on every commit to `main`, ensuring npm is always up to date with the latest code, and stable releases are mapped to tags.
