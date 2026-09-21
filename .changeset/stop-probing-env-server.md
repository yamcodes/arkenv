---
"arkenv": major
---

#### Stop probing `env/server.ts` in CLI schema discovery

Convention discovery no longer auto-resolves leftover split-layout filenames
(`env/server.ts`, `src/env/server.ts`). Location remains `--schema` / `-s`,
then flat convention paths (`env.ts`, `src/env.ts`, and related extensions).

**BREAKING CHANGE**: If `arkenv check` previously found your schema only
because `env/server.ts` (or `src/env/server.ts`) existed, point `--schema`
at a module the CLI can load — typically the recipe's client schema, or add
a flat `env.ts` / `src/env.ts`. Do not pass a server module that imports
`server-only`; Jiti loads schemas in plain Node and that import throws
outside the `react-server` condition.

```json
{
  "scripts": {
    "check": "arkenv check --schema env/client.ts"
  }
}
```
