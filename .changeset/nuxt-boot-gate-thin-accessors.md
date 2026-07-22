---
"@arkenv/nuxt": minor
---

#### Coerce Nuxt env at Nitro boot and thin-read the payload

Register a Nitro boot gate from `@arkenv/nuxt/module` that validates/coerces schema keys into `runtimeConfig` (including `public`) after `NUXT_*` / `NUXT_PUBLIC_*` string overrides. Server and client `arkenv()` entries become thin readers of that coerced payload — client package entries no longer import `@arkenv/core` / `arktype`.

Usage is unchanged:

```ts
// env.ts
import arkenv from "@arkenv/nuxt";

export const env = arkenv({
  DATABASE_URL: "string",
  NUXT_PUBLIC_PORT: "number",
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
```

After boot, `env.NUXT_PUBLIC_PORT` is a `number` on both server and client (including when overridden via `NUXT_PUBLIC_PORT` at Nitro start). Import `type` from `arktype` or `@arkenv/core` when you need ArkType helpers in schema files.
