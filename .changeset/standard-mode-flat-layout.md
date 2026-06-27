---
"@arkenv/nextjs": minor
"@arkenv/nuxt": minor
---

#### Add flat-layout overload and `createEnv` named export to standard mode integrations

Introduce flat-layout signature overloads to both `@arkenv/nextjs/standard` and `@arkenv/nuxt/standard` entry points, allowing Standard Schema users to use the same unified flat configuration schema as the core ArkType mode.

Also export `createEnv` as a named and default alias of `arkenv` in all `@arkenv/nextjs/standard` entry points for perfect API parity.

Remove deprecated `(coreCreateEnv as any)` casts from Next.js config generator to enforce compile-time type validation of standard mode flat-layout output.
