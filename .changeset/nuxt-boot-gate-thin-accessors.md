---
"@arkenv/nuxt": minor
---

#### Deliver coerced Nuxt public env on the client without shipping the validator

Public/shared keys (for example `NUXT_PUBLIC_PORT: "number"`) now keep their coerced types on both server and client after deploy-time `NUXT_PUBLIC_*` overrides, and client bundles that import `@arkenv/nuxt` / `@arkenv/nuxt/client` no longer pull in `@arkenv/core` or `arktype`.

```ts
// env.ts — same import as before
import arkenv from "@arkenv/nuxt";

export const env = arkenv({
  DATABASE_URL: "string",
  NUXT_PUBLIC_PORT: "number",
});

// After `NUXT_PUBLIC_PORT=4000` at Nitro boot:
env.NUXT_PUBLIC_PORT; // 4000 (number) on server and in the browser
```

Requires `@arkenv/nuxt/module` (or `@arkenv/nuxt/standard/module`) so the Nitro boot gate can validate and coerce before the payload is sent to the client. Import `type` from `arktype` or `@arkenv/core` when you need ArkType helpers in schema files.
