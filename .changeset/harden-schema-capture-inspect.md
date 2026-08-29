---
"arkenv": minor
"@arkenv/core": patch
"@arkenv/standard": patch
---

#### Fail closed when the CLI cannot inspect your schema

`arkenv example` and `arkenv check` now fail with a clear error when the schema module never calls `arkenv()`, the installed runtime is too old for inspect, the definition cannot be read as keys, or the module uses `env` values at load time — instead of treating those cases as an empty schema.

Upgrade `@arkenv/core` or `@arkenv/standard` alongside the CLI so inspect works. Keep the schema declarative (`export const env = arkenv({ ... })`) and do not read `env` at module scope. `arkenv({})` remains a valid empty schema.
