---
"@arkenv/nuxt": patch
---

#### Add build-time validation and dynamic runtime config support

- **Build-time validation**: Added automatic validation of environment variables against your schema during dev server startup and production build. Missing or invalid variables will now fail the build immediately (previously, validation was not run during build). This behavior can be controlled via the `validate` option (which defaults to `true`):
  ```ts
  // nuxt.config.ts
  export default defineNuxtConfig({
    modules: ["@arkenv/nuxt/module"],
    arkenv: {
      validate: false // Disable build-time validation
    }
  })
  ```
- **Dynamic runtime overrides**: Environment variables are now resolved dynamically at runtime rather than at import time. This allows you to swap environment variable values at runtime (e.g., in different deployment environments) without needing to rebuild the application.

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
