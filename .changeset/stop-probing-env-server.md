---
"arkenv": major
---

#### Stop probing `env/server.ts` in CLI schema discovery

Convention discovery no longer auto-resolves leftover split-layout filenames
(`env/server.ts`, `src/env/server.ts`). Location remains `--schema` / `-s`,
then flat convention paths (`env.ts`, `src/env.ts`, and related extensions).

**BREAKING CHANGE**: If `arkenv check` previously found your schema only
because `env/server.ts` (or `src/env/server.ts`) existed, pass `--schema`
explicitly (or add a flat `env.ts` / `src/env.ts`):

```json
{
  "scripts": {
    "check": "arkenv check --schema env/server.ts"
  }
}
```
