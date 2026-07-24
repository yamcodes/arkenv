---
"@arkenv/vite-plugin": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
---

#### Align missing-schema errors with short, actionable host guidance

Point missing-schema errors at checked paths / `schemaPath` and `arkenv init`, matching the Bun plugin style, without embedding starter `env.ts` modules.
