---
"@arkenv/cli": patch
---

#### Check git working tree is clean before `arkenv init`

The CLI now verifies the git working tree is clean before modifying files in the existing-project flow. If the working tree is dirty and `--force` is not provided, the command aborts with a clear error message. Use `--force` to bypass this check.

Non-git repositories and clean working trees proceed normally without any extra prompts.
