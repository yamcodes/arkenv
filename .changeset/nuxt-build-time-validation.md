---
"@arkenv/nuxt": minor
---

#### Add build-time validation and dynamic runtime proxy to the Nuxt module

Add `validate` option to the `@arkenv/nuxt` module. When enabled, environment variables are validated at build and dev time using your schema file — invalid or missing variables fail the build with a descriptive error.

Unlike the Next.js integration, the Nuxt module requires **no code generation** and creates no files. Public variables are resolved at runtime through Nuxt's `useRuntimeConfig()`, so the same build artifact can be deployed across multiple environments by simply changing the environment variables — no rebuild needed.

Usage:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@arkenv/nuxt/module"],
  arkenv: {
    schemaPath: "./env.ts", // default: env.ts or src/env.ts
    validate: true,         // default: true
    layout: "flat"          // or "strict"
  }
})
```

```ts
// env.ts
import arkenv from "@arkenv/nuxt"

export const env = arkenv({
  DATABASE_URL: "string",
  NUXT_PUBLIC_API_URL: "string",
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
})
```

The `env` proxy reads `DATABASE_URL` from `runtimeConfig` on the server and throws a descriptive runtime error if a server-only variable is accessed in client-side code.
