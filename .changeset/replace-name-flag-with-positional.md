---
"@arkenv/cli": minor
---

#### Replace `--name`/`-n` flag with `[project-name]` positional argument on `init` command

The `init` command now accepts an optional `[project-name]` positional argument (e.g., `arkenv init my-new-project` or `arkenv init .`).

The `--name` and `-n` flags have been removed.

**BREAKING CHANGE**: The `--name` / `-n` flags are no longer supported and will result in a parsing error. Use the positional `[project-name]` argument instead.
