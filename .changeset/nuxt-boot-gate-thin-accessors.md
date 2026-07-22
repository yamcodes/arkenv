---
"@arkenv/nuxt": patch
---

#### Keep coerced Nuxt public env types after deploy-time overrides

Deploy-time `NUXT_PUBLIC_*` overrides used to leave public values as strings in the browser (for example `env.NUXT_PUBLIC_PORT === "4000"`). Those values now stay coerced on both server and client (`4000` as a `number`), and importing `@arkenv/nuxt` / `@arkenv/nuxt/client` no longer ships the validator into the client bundle.

```ts
// env.ts — same API as before
import arkenv from "@arkenv/nuxt";

export const env = arkenv({
  DATABASE_URL: "string",
  NUXT_PUBLIC_PORT: "number",
});

// After NUXT_PUBLIC_PORT=4000 at Nitro boot:
typeof env.NUXT_PUBLIC_PORT; // "number" on server and in the browser
```
