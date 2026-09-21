---
"arkenv": major
---

#### Stop auto-discovering `env/server.ts` / `src/env/server.ts`

CLI schema discovery no longer probes leftover strict-layout filenames.
Convention paths stay flat (`env.ts`, `src/env.ts`, and related
extensions). Split-recipe projects should pass `--schema` (or point
`check` at the module they intend).

**BREAKING CHANGE**: If `arkenv check` previously found your schema only
via `env/server.ts` or `src/env/server.ts`, pass that path explicitly:

```bash
npx arkenv check --schema ./env/server.ts
```
