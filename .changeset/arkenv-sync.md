---
"arkenv": minor
---

#### Add `arkenv sync` to generate `.env.example` from the schema

`arkenv sync` now loads the project schema and writes `.env.example` with
every declared key. Existing comments and values are preserved for keys
that remain in the schema; removed keys are dropped; new keys are
appended. `arkenv init` reuses the same path after scaffolding an
existing project.

Usage:

```sh
npx arkenv@latest sync
npx arkenv@latest sync --schema ./src/env.ts --json
```
