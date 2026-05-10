---
name: gh-issue-workflow
description: Automates the process of working on GitHub issues, including branch creation, issue linking, label management, and PR creation. Use when the user asks to "work on", "start", "fix", or "grab" a specific GitHub issue.
---

# GitHub Issue Workflow

This skill provides a standardized, efficient workflow for managing GitHub issues from inception to Pull Request using the `gh` CLI.

## Workflow

### 1. Initialization & Context Gathering
When triggered by a request to work on an issue (e.g., "Grab issue #123"), follow these steps:

1.  **Retrieve Issue Details**: Fetch the issue context to understand the requirements and existing state.
    ```bash
    gh issue view <issue-number> --json title,body,labels,assignees
    ```
2.  **Setup Development Branch**: Use the standard GitHub CLI command to create and checkout a linked development branch. This ensures the branch is properly associated with the issue in the GitHub UI.
    ```bash
    gh issue develop <issue-number> --checkout
    ```
    *Note: If a branch already exists, this command will switch to it.*

### 2. Label Management
Maintain accurate issue and PR status by managing labels effectively.

1.  **Fetch Available Labels**: Always check the repository's available labels to ensure you use valid ones.
    ```bash
    gh label list --json name,description
    ```
2.  **Update Issue Status**: If the project uses a "status" label (e.g., `in-progress`, `status: in-progress`), apply it to the issue.
    ```bash
    gh issue edit <issue-number> --add-label "<label-name>"
    ```

### 3. Implementation & Validation
Proceed with the standard **Research -> Strategy -> Execution** lifecycle as defined in your core mandates. Use the issue description as your primary requirement document.

### 4. Pull Request Creation
When the task is complete, or when instructed to "create a PR" or "wrap up":

1.  **Commit and Push**: Ensure all changes are committed and pushed to the remote.
    ```bash
    git push -u origin HEAD
    ```
2.  **Generate PR**: Create the Pull Request. Use the issue title as a base and ensure the body contains the magic word `Fixes #<issue-number>` to automate issue closing on merge.
    ```bash
    gh pr create --title "fix: <issue-title>" --body "Fixes #<issue-number>\n\n<brief-description-of-changes>" --label "<appropriate-labels>"
    ```
    *Use labels identified in Step 2 that are appropriate for a Pull Request.*

## Best Practices
- **Link Everything**: Always use `gh issue develop` and `Fixes #<num>` to maintain a clear audit trail.
- **Label Accuracy**: Do not guess labels. Always refer to the output of `gh label list`.
- **Atomic PRs**: If an issue covers multiple distinct tasks, consider creating separate PRs if the workflow allows, or clearly delineate them in the PR body.
