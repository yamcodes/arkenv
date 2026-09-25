---
"arkenv": major
---

#### Remove package.json `"arkenv"` schema pointer from CLI discovery

`arkenv init` no longer writes a `package.json` `"arkenv"` field, and CLI
schema discovery no longer reads one. Location is `--schema` / `-s`, then
convention paths (`env.ts`, `src/env.ts`). Leftover `"arkenv"` keys are
ignored.

**BREAKING CHANGE**: If you relied on `package.json` `"arkenv"` (string or
`{ "schema": "…" }`) for `arkenv check`, put the path on `--schema` in your
scripts instead:

```json
{
  "scripts": {
    "check": "arkenv check --schema config/env.ts"
  }
}
```
