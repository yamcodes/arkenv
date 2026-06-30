---
"@arkenv/nuxt": minor
---

#### Add build-time validation and `env.gen.ts` codegen to the Nuxt module

Add `validate` and `codegen` options to the `@arkenv/nuxt` module. When enabled, environment variables are validated at build and dev time, and a typed `env.gen.ts` factory is generated next to the schema file. The module also regenerates the factory when the schema changes during development.

Usage:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@arkenv/nuxt"],
  arkenv: {
    schemaPath: "./env.ts",
    validate: true,
    codegen: true,
    outputPath: "./generated/env.gen.ts",
    layout: "flat"
  }
})
```

```ts
// env.ts
import { createEnv } from "./generated/env.gen"
import { type } from "arktype"

export const env = createEnv({
  DATABASE_URL: type.string,
  NUXT_PUBLIC_API_URL: "string"
})
```

