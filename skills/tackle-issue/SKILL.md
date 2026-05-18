---
name: tackle-issue
description: Automates the process of working on GitHub issues, including branch creation, issue linking, label management, validation, changesets, and PR creation. Triggered by the command "/tackle-issue ISSUE_NUMBER".
metadata:
   internal: true
---

# Tackle Issue

This skill provides a standardized, rigorous workflow for handling GitHub issues. It ensures that issues are properly vetted before work begins and that all changes meet the project's quality standards before a Pull Request is opened.

## Trigger

Use this skill whenever the user says `/tackle-issue <number>` or asks to "tackle", "handle", or "fix" a specific issue number in a structured way.

## Workflow

### 1. Readiness Check & Context Gathering

Before starting any work, you MUST verify that the issue is ready for an agent.

1. **Retrieve Issue Details**: Fetch the issue context, including labels and comments.
   ```bash
   gh issue view <issue-number> --json title,body,labels,comments
   ```
2. **Verify "ready for agent" Label**: Check if the `ready for agent` label is present in the `labels` array.
   - **If the label is MISSING**: Abort the process immediately. Inform the user: `Issue #<number> is not marked as 'ready for agent'. Please ensure it is fully specified and labeled correctly before proceeding.`
   - **If the label is PRESENT**: Continue to the next step.

### 2. Development Setup

1. **Setup Development Branch**: Create and checkout a linked development branch.
   ```bash
   gh issue develop <issue-number> --checkout
   ```
   *Note: If a branch already exists, this command will switch to it.*

### 3. Implementation

Proceed with the standard **Research -> Strategy -> Execution** lifecycle.

- **Research**: Understand the issue and surrounding code.
- **Strategy**: Plan the fix or feature.
- **Execution**: Apply changes surgically. Ensure that:
  - New tests are added to verify the fix or feature.
  - Relevant documentation is updated.

### 4. Validation & Quality Assurance

Once implementation is complete, you MUST run the following validation suite in the project root:

1. **Type Check**:
   ```bash
   pnpm run typecheck
   ```
2. **Test Suite**:
   ```bash
   pnpm run test
   ```
3. **Lint & Format Check**:
   ```bash
   pnpm run fix
   ```

If this step fails (some lint/formatting issues cannot be auto-fixed), you MUST diagnose and fix the errors before proceeding.

### 5. Changeset Creation

After validation passes, you MUST create a changeset using the `creating-changesets` skill.

- Determine the appropriate bump type (`patch` or `minor` for v0) based on the `creating-changesets` guidelines.
- Provide a clear, concise description starting with a `####` header.

### 6. Pull Request Creation

When the task is complete and validated:

1. **Commit and Push**: Stage all changes (including the changeset) and push.
   ```bash
   git add .
   git commit -m "fix: tackle issue #<issue-number>"
   git push -u origin HEAD
   ```
2. **Create Pull Request**:
   - **Title**: Use `fix: <issue-title>` or `feat: <issue-title>`.
   - **Body**: MUST include `Fixes #<issue-number>` to link the PR to the issue.
   - **Labels**: Apply relevant labels from the original issue (excluding `ready for agent`).
   ```bash
   gh pr create --title "fix: <issue-title>" --body "Fixes #<issue-number>\n\n<brief-description-of-changes>" --label "<labels>"
   ```

## Best Practices

- **Strict Readiness**: Never bypass the `ready for agent` check. It ensures the task is well-defined.
- **Validation First**: Never open a PR that fails `typecheck`, `test`, or `check`.
- **Link Everything**: Always use `gh issue develop` and `Fixes #<num>` for traceability.
- **Changesets**: Always include a changeset for consumer-facing changes.
