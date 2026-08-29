---
"@arkenv/nuxt": major
---

#### Throw when the Nuxt module cannot resolve an env schema

**BREAKING CHANGE**: The `@arkenv/nuxt` module now throws when no schema file is found (auto-discovery or `schemaPath`), instead of warning and skipping setup. Create an `env.ts` (or `src/env.ts`) schema, or set `arkenv.schemaPath` in `nuxt.config.ts`.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@arkenv/nuxt/module"],
  arkenv: {
    schemaPath: "./env.ts", // required if auto-discovery cannot find a schema
  },
});
```
