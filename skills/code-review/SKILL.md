---
name: code-review
description: Fetch, analyze, and address code reviews and comments on GitHub, or perform a code review on changes in the workspace. Make sure to use this skill whenever the user mentions code reviews, addressing PR reviews, fixing PR comments, resolving review feedback, performing a code review, or running '/code-review', even if they don't explicitly name GitHub or the PR number.
metadata:
  internal: true
---

# Code Review

A dual-purpose skill to either (1) systematically retrieve and address pull request review comments on GitHub, or (2) perform a code review on changes in the workspace.

## Workflow Selection

At the start of execution, identify the user's intent:

- **Mode A: Address / Fix Review Comments**: Follow this mode if the user wants to address, fix, or resolve comments/feedback from a prior or active review (e.g., "fix PR comments", "address review notes", "resolve feedback", "address /code-review").
- **Mode B: Perform Code Review**: Follow this mode if the user wants a review of their changes or the current workspace (e.g., "review my code", "check these changes", "do a code review", "/code-review").

---

## Mode A: Address / Fix Review Comments

Systematically retrieve and fix comments from a PR review.

### 1. Locate current PR and comments
- Run `git status` to find the current branch.
- Run `gh pr status` to find the active pull request number and repository information.
- **Fetch Comments (Avoid Truncation)**: Standard commands like `gh pr view <PR_NUMBER> --comments` can be truncated by the shell pager or terminal output limits. To reliably retrieve the complete list of comments, query the GitHub API directly:
  ```bash
  gh api repos/:owner/:repo/pulls/<PR_NUMBER>/comments --jq '.[] | {id, path, line, body}'
  ```

### 2. Parse and analyze comments
- Extract the list of review comments. Focus on unresolved or actionable requests.
- For each comment, identify the affected file path, line numbers, and expected outcome.
- **Check for Stale/Addressed Comments**: Before making any code modifications, verify if the comment is already addressed or stale (e.g. if the target code has already been changed or deleted in a recent commit). Mark such comments as "Stale/Already Addressed" and skip them.
- **Handle Ambiguity / Ask for Clarification**: If a comment is ambiguous, lacks context, or if you are unsure of the best implementation path, STOP and ask the user for clarification. Do not make risky assumptions.

### 3. Implement the fixes
- View the surrounding code using the `view_file` tool to understand context.
- Update the code using `replace_file_content` or `multi_replace_file_content`. Keep changes minimal and adhere strictly to the codebase's existing code style, imports, and naming patterns.

### 4. Verify changes
- Compile/build the package (e.g., `pnpm build`, `npm run build`, or `tsc --noEmit`).
- Run the test suite (e.g., `pnpm test`, `npm test`, or `vitest`) to ensure all tests pass.
- Run size limit checks if applicable.

### 5. Report results & comment back
- Present a clear markdown table summarizing:
  - Review comment / concern.
  - File and lines changed.
  - Action taken (e.g., "Fixed", "Already Addressed", "Skipped").
  - Verification status.
- **Comment back on PR**: Use the GitHub CLI or API to reply to the comments or post a summary comment on the PR:
  - To reply to an individual comment thread:
    ```bash
    gh api repos/:owner/:repo/pulls/comments/<comment_id>/replies -f body="Addressed in latest commit."
    ```
  - To add a general comment to the PR:
    ```bash
    gh pr comment <PR_NUMBER> --body "Addressed review comments: ..."
    ```

---

## Mode B: Perform Code Review

Perform a high-quality, professional code review of the workspace changes.

### 1. Retrieve changes
- Run `git status` to check modified files.
- Run `git diff` (or compare branches) to retrieve the full diff of the changes under review.

### 2. Analyze the changes
Review the diff/code for:
- **Correctness & Bugs**: Off-by-one errors, edge cases, incorrect conditional logic.
- **TypeScript & Types**: Stale or weak types, unsafe casts, unused imports or variables.
- **Dead Code**: Functions, imports, or files that are defined but never used.
- **Stale JSDoc & Docs**: Stale doc comments that refer to renamed functions or old signatures.
- **Architectural Patterns**: Consistency with the repository's architecture (e.g. modular structure, proper abstraction boundaries).

### 3. Report review findings
Output the code review structured by file:
- For each file, list specific findings with line numbers and recommendations.
- Categorize findings into:
  - ⚠️ **Critical / Issues**: Bugs, type/compilation errors, or logic issues.
  - ℹ️ **Refactors / Cleanup**: Dead code, unused imports, stale JSDoc.
  - 💡 **Suggestions / Nits**: Minor styling, readability improvements, or alternative approaches.
