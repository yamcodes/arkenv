---
"@arkenv/nuxt": patch
---

#### Prefer coerced env values over raw strings in the Nuxt security proxy

**Bug:** Validation already coerced schema keys (for example `PORT: "number"` → `3000`), but the security proxy re-read raw `process.env` / `runtimeConfig` / `__NUXT__` strings first. Those strings won, so `env` still returned the uncoerced type.

```diff
  // env.ts
  export const env = arkenv({
    PORT: "number",
    NUXT_PUBLIC_PORT: "number",
  });

  // process.env.PORT = "3000" (and the same shape in runtimeConfig / __NUXT__)
- env.PORT; // "3000" (string) — proxy preferred the raw source
+ env.PORT; // 3000 (number) — proxy returns the coerced validation target
```

Same import surface. Distinct from deploy-time `NUXT_PUBLIC_*` override coercion (Nitro string overrides at boot).
