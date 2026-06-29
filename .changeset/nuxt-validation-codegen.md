---
"@arkenv/nuxt": minor
---

#### Add build-time validation and `env.gen.ts` codegen to the Nuxt module

Add `validate` and `codegen` options to the `@arkenv/nuxt` module so environment variables are validated at build/dev time and a typed `env.gen.ts` factory can be generated automatically.

Usage:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@arkenv/nuxt"],
  arkenv: {
    schema: "./env.ts",
    validate: true,
    codegen: {
      enabled: true,
      path: "./generated/env.gen.ts",
      layout: "flat"
    }
  }
})
```

```ts
// env.ts
import { createEnv } from "./generated/env.gen"
import { type } from "arktype"

export const env = createEnv({
  DATABASE_URL: type.string,
  NEXT_PUBLIC_API_URL: "string"
})
```

- Enable live regeneration of `env.gen.ts` when the schema file changes in development.
- Expose `setupArkEnv`, `runCodegen`, and `validateSchema` helpers for custom integrations.
