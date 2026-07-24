---
"@arkenv/build": patch
"@arkenv/bun-plugin": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
---

#### Align missing-schema errors via a shared `@arkenv/build` helper

Centralize missing-schema message text in `formatMissingSchemaError` so Bun, Next, and Nuxt stay aligned: short actionable guidance (`schemaPath` + `arkenv init`), no embedded starter `env.ts` modules.
