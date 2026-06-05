#!/bin/bash
set -e

# Usage:
#   ./scripts/promote-docs.sh rescue <commit-hash-1> [commit-hash-2 ...]
#   ./scripts/promote-docs.sh reconcile

MODE=$1

if [ "$MODE" = "rescue" ]; then
  if [ "$#" -lt 2 ]; then
    echo "Usage: $0 rescue <commit-hash-1> [commit-hash-2 ...]"
    exit 1
  fi
  COMMITS=("${@:2}")
  
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "❌ Error: Working directory has uncommitted changes. Commit or stash them first."
    exit 1
  fi
  
  echo "Fetching latest changes..."
  git fetch origin
  
  BRANCH_NAME="hotfix/docs-rescue-$(date +%s)"
  echo "Creating rescue branch '$BRANCH_NAME' from origin/main..."
  git checkout -b "$BRANCH_NAME" origin/main
  
  echo "Cherry-picking commits: ${COMMITS[*]}"
  for commit in "${COMMITS[@]}"; do
    git cherry-pick "$commit"
  done
  
  echo "Pushing rescue branch to origin..."
  git push origin "$BRANCH_NAME"
  
  echo "✅ Success! Hotfix branch '$BRANCH_NAME' pushed."
  if command -v gh &> /dev/null; then
    echo "Creating PR to main using GitHub CLI..."
    gh pr create --base main --head "$BRANCH_NAME" --title "docs: rescue doc changes" --body "Cherry-picked doc changes to production." || echo "⚠️ Warning: Could not automatically create Pull Request. Please open one manually."
  else
    echo "Please open a PR to merge '$BRANCH_NAME' into 'main' via the GitHub UI."
  fi
  
elif [ "$MODE" = "reconcile" ]; then
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "❌ Error: Working directory has uncommitted changes. Commit or stash them first."
    exit 1
  fi

  echo "Fetching latest changes..."
  git fetch origin
  
  echo "Switching to dev branch..."
  git checkout dev
  git pull origin dev
  
  echo "Reconciling dev with origin/main..."
  if git merge origin/main --no-edit; then
    echo "Pushing reconciled dev branch to origin..."
    git push origin dev
    echo "✅ Success! dev branch reconciled with main."
  else
    echo "❌ Merge conflict detected during reconciliation."
    echo "Please resolve conflicts, commit, and run: git push origin dev"
    exit 1
  fi
else
  echo "Usage:"
  echo "  $0 rescue <commit-hash-1> [commit-hash-2 ...]"
  echo "  $0 reconcile"
  exit 1
fi
