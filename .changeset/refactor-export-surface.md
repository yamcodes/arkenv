---
"arkenv": major
---

Remove `arkenv/arktype` sub-path export (breaking). The `type` helper is now exported from the main `arkenv` entry. Consumers of `{ type } from "arkenv/arktype"` should update to `{ type } from "arkenv"`.

Adds `arkenv/standard` (ArkType-free `createEnv` for Standard Schema users) and `arkenv/core` (`ArkEnvError` and `ValidationIssue` error type).
