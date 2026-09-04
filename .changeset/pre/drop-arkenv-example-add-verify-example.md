---
"arkenv": major
---

#### Drop `arkenv example` command and add `--verify-example` check flag

The `arkenv example` command and AST block merger engine have been dropped. A new read-only `--verify-example` flag has been added to `arkenv check` to strictly verify that all declared schema keys are present in `.env.example` (or a custom example file path) without mutating files on disk.

Usage:

```sh
# Verify .env.example contains all schema keys
npx arkenv@latest check --verify-example

# Verify custom example file
npx arkenv@latest check --verify-example .env.example.production
```

**BREAKING CHANGE**: The `arkenv example` command has been removed. Use `arkenv check --verify-example` to verify `.env.example` in CI and pre-commit workflows.
