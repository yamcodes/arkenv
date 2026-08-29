---
"@arkenv/nuxt": patch
---

#### Coerce Nuxt public env overrides instead of leaving them as strings

**Bug:** With a numeric (or boolean) public schema key, setting a deploy-time override made Nitro put a *string* into `runtimeConfig.public`. That string won, so `env` lied about the type on server and client.

```diff
  // env.ts
  export const env = arkenv({
    NUXT_PUBLIC_PORT: "number",
  });

  // Deploy / Nitro boot: NUXT_PUBLIC_PORT=4000
- env.NUXT_PUBLIC_PORT; // "4000" (string) — schema said number
+ env.NUXT_PUBLIC_PORT; // 4000 (number) — coerced after the override
```

Same import surface. As a side effect, `@arkenv/nuxt` / `@arkenv/nuxt/client` no longer ship the validator into the browser bundle.
