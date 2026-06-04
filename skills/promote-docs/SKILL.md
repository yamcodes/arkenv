---
name: promote-docs
description: Deploy documentation changes to production immediately without waiting for a new npm release. Use this skill whenever the user mentions 'hotfix docs', 'push doc changes live now', 'promote docs to main', 'bypass package release for docs', or wants to rescue already-merged doc commits from dev. It handles cherry-picking to main and merging main back into dev to prevent git drift.
metadata:
  internal: true
---

# Promote Docs

This skill enables you to safely deploy documentation updates directly to the production branch (`main`) without triggering a full npm release, while ensuring that the `dev` and `main` branches remain in a clean, compatible topological state (preventing future merge conflicts).

---

## Workflows

Depending on whether the doc changes have already been committed to `dev`, choose one of the following two paths.

### Path A: The Standard Hotfix (Changes not yet committed to `dev`)

Use this path if the doc changes are fresh and not yet merged into the `dev` branch.

1. **Create Hotfix Branch from `main`**:
   Checkout a new branch branching off `origin/main` (e.g. `hotfix/docs-xyz`).
2. **Apply Changes**:
   Make the documentation updates, commit them on the hotfix branch.
3. **Submit PR**:
   Push the branch and open a Pull Request targeting `main`.
4. **Deploy**:
   Once the PR is merged to `main`, the production docs deploy immediately.
5. **Reconcile**:
   Follow the [Reconciliation Step](#reconciliation-step) below to merge `main` back into `dev` and prevent drift.

---

### Path B: The Rescue (Changes already merged to `dev`)

Use this path if the doc changes have already been merged into `dev`, but `dev` contains other unreleased features that should *not* be pushed to production yet.

1. **Identify Commit Hashes**:
   Locate the specific commit hashes on `dev` that contain the doc changes.
2. **Run Rescue Script**:
   Execute the helper script to cherry-pick these commits onto a branch from `origin/main`:
   ```bash
   ./scripts/promote-docs.sh rescue <commit-hash-1> [commit-hash-2 ...]
   ```
3. **Submit PR**:
   The script will automatically push the branch and attempt to open a PR to `main` via `gh` CLI. If `gh` is unavailable, open the PR manually.
4. **Deploy**:
   Once the PR is merged to `main`, the production docs deploy immediately.
5. **Reconcile**:
   Follow the [Reconciliation Step](#reconciliation-step) below to merge `main` back into `dev` and prevent drift.

---

## Reconciliation Step

Reconciling `main` back into `dev` is the critical step to prevent git history drift. Because `main` received the doc commits (via merge or cherry-pick), it has diverged from `dev`. Merging `main` back to `dev` reconciles their histories so that the next automated package release can successfully fast-forward `main` to `dev`.

1. Run the reconciliation script:
   ```bash
   ./scripts/promote-docs.sh reconcile
   ```
2. **Handle Conflicts**:
   - If git merges cleanly, the script automatically pushes the reconciled `dev` branch to origin.
   - If there are conflicts (e.g., if the file you modified also has other unreleased changes surrounding it on `dev`), the script will exit. You must resolve the conflicts manually, finish the merge commit, and push:
     ```bash
     git add <resolved-files>
     git commit -m "chore: reconcile main into dev"
     git push origin dev
     ```
