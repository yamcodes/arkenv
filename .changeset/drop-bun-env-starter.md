---
"@arkenv/bun-plugin": patch
---

#### Drop env.ts starter from Bun missing-schema errors

Keep the hybrid discovery error short and actionable (checked paths + `arkenv init` hint) instead of embedding an example `src/env.ts` module.
