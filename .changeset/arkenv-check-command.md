---
"arkenv": minor
"@arkenv/core": patch
---

#### Add `arkenv check` command and cross-module validation detection

- Add `arkenv check` CLI command to validate the active environment against the project's env schema, supporting `--schema` (`-s`), repeatable `--env-file`, `--json`, `--quiet`, and `--agent` with CI-friendly exit codes.
- Add structural `ArkErrors` verification in `@arkenv/core` so cross-module-instance schema evaluation reliably surfaces validation issues.

