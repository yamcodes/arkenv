---
name: gh-cli
description: Use for GitHub-related tasks such as managing issues, pull requests, actions runs, and repository configuration using the GitHub CLI (gh).
metadata:
  internal: true
---

# Gh CLI

This skill provides guidance for using the GitHub CLI (`gh`) to automate and streamline GitHub workflows.

## Common workflows

### Actions & runs

- **List recent runs**: `gh run list`
- **View a specific run**: `gh run view <run-id>`
- **View job logs**: `gh run view <run-id> --job <job-id> --log`
- **Rerun failed jobs**: `gh run rerun <run-id> --failed`

### Pull requests

- **List PRs**: `gh pr list`
- **View PR details**: `gh pr view <pr-number>`
- **Check PR status**: `gh pr status`
- **Create a PR**: `gh pr create --title "..." --body "..."`
- **Merge a PR**: `gh pr merge <pr-number> --merge` (or `--squash`, `--rebase`)

### Issues

- **List issues**: `gh issue list`
- **View issue**: `gh issue view <issue-number>`
- **Create issue**: `gh issue create --title "..." --body "..."`

## Best practices

- **Use `--repo`**: When working in a multi-repo context or if not in a git repo, always specify `--repo <owner>/<repo>`.
- **JSON Output**: Use `--json` with `-q` (jq filter) for scriptable output.
- **Help**: Use `gh <command> --help` to discover more flags.

See [references/commands.md](references/commands.md) for a comprehensive list of commands and examples.
