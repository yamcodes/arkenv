---
"@arkenv/build": patch
"arkenv": minor
"@arkenv/nuxt": minor
---

#### Align Nuxt flat layout across CLI, examples, and build resolution

Forward-port flat layout support for Nuxt on v1 by aligning CLI scaffolding, build-time validation, runtime proxy behavior, and `@arkenv/build` layout resolution.

Usage:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@arkenv/nuxt/module"],
  arkenv: { layout: "flat" },
});
```

```ts
// env.ts
import arkenv from "@arkenv/nuxt";

export const env = arkenv({
  DATABASE_URL: "string",
  NUXT_PUBLIC_API_URL: "string",
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
```

- `arkenv` init wizard presents "Flat (Recommended)" for Nuxt and scaffolds a flat `env.ts`
- `@arkenv/build` `resolveLayout()` accepts `"flat"` as an alias for the single-file layout mode
- Nuxt examples and playgrounds use flat layout conventions
