---
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
---

#### Align Next and Nuxt missing-schema errors with Bun

Point missing-schema errors at `schemaPath` and `arkenv init`, matching the Bun plugin style, without embedding starter `env.ts` modules.
