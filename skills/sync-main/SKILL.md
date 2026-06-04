---
name: sync-main
description: Deploy documentation and infrastructure changes to production immediately without waiting for a new npm release. Use this skill whenever the user mentions 'hotfix docs', 'push doc changes live now', 'promote docs to main', 'bypass package release for docs', 'sync-main', 'sync main', or wants to rescue already-merged doc commits from dev. It handles cherry-picking to main and merging main back into dev to prevent git drift.
metadata:
  internal: true
---

# Sync Main

This skill enables you to safely sync documentation and tooling changes from the `dev` branch to `main` without waiting for the next package release, while ensuring that the `dev` and `main` branches remain in a clean, compatible topological state (preventing future merge conflicts).

---

## Analysis Step (Do This First)

Before performing any Git actions, you must analyze the changes between `dev` and `main` to classify the sync:

Run the following command to check the list of changed files:
```bash
git fetch origin
git diff --name-only origin/main...origin/dev
```

Based on the file list, classify the sync into one of the following three categories:

1. **Doc-Only (Easy Case)**: All changed files are strictly under `docs/`, `www/`, or are root-level Markdown files (matching the regex `^(docs/|www/|[^/]+\.md)$`).
2. **Infra-Only (Easy Case + Force)**: There are **no changes** in the `packages/` directory, but there are changes to workflows, scripts, or skills (e.g. `.github/workflows/`, `scripts/`, `skills/`).
3. **Code Changes (Hard Case)**: There are modifications to files in the `packages/` directory (unreleased library features or fixes).

---

## Easy Case Workflows

### Category 1: Doc-Only Sync
Since the changes are strictly doc-only, they are safe to sync directly:
- Instruct the user that they can run the **Sync main** workflow normally.
- Or trigger it automatically via GitHub CLI:
  ```bash
  gh workflow run sync-main.yml --ref dev
  ```

### Category 2: Infra-Only Sync
Since the changes contain tooling or workflow updates but do not touch the library package code, they can be synced, but the workflow's safety check will block them unless overridden:
- Instruct the user that they can run the **Sync main** workflow but **must check the `force_override` checkbox** in the GitHub UI.
- Or trigger it automatically via GitHub CLI with the bypass flag:
  ```bash
  gh workflow run sync-main.yml --ref dev -f force_override=true
  ```

---

## Hard Case Workflow

If there are changes in the `packages/` directory, **do not execute any git commands automatically**. You must stop and interview the user in the chat to align on how to proceed.

### The Interview

Present the user with a clear summary of the unreleased package files that were detected, outline their choices, and make a **recommendation** based on the situation:

1. **Option 1: Wait for Release**
   - Keep the doc changes on `dev` and let them deploy naturally on the next package release.
   - *Recommendation*: Use this if the doc fix is not urgent.
2. **Option 2: Run a Patch Release**
   - Release a patch version of the packages (`pnpm changeset` -> trigger release workflow).
   - *Recommendation*: Use this if the doc fix is urgent, and the unreleased library code on `dev` is stable and ready to go live.
3. **Option 3: Cherry-Pick/Rescue**
   - Cherry-pick only the doc commits onto `main` and reconcile `dev` back to `main`.
   - *Recommendation*: Use this only if the doc fix is urgent, but the library code on `dev` is incomplete and cannot be released.

---

### Executing Option 3 (Cherry-Pick / Rescue)

If the user explicitly approves **Option 3**, follow these steps using the helper script:

1. **Identify Commit Hashes**:
   Locate the specific commit hashes on `dev` containing the doc changes.
2. **Run Rescue Script**:
   Execute the helper script to cherry-pick these commits onto a branch from `origin/main`:
   ```bash
   ./scripts/sync-main.sh rescue <commit-hash-1> [commit-hash-2 ...]
   ```
3. **Submit PR**:
   The script will attempt to create a PR to `main` via `gh` CLI. If it fails, help the user open the PR manually.
4. **Deploy**:
   Once the PR is merged to `main`, the production docs deploy immediately.
5. **Reconcile**:
   Merge `main` back into `dev` to prevent drift:
   ```bash
   ./scripts/sync-main.sh reconcile
   ```
   If conflicts occur during reconciliation, prompt the user to help resolve them, commit, and push `dev`.
