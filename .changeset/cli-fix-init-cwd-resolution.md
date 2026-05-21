---
"@arkenv/cli": patch
---

#### Fix working directory resolution when executing via monorepo scripts

Ensure that the CLI processes paths and directory status checks relative to the directory where the command was initiated (`INIT_CWD`), rather than the monorepo root. 

This fixes issues where running the CLI locally via workspace runners like `pnpm arkenv` from outside the workspace root failed with empty-directory checks.
