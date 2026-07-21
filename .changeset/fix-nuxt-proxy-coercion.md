---
"@arkenv/nuxt": patch
---

#### Keep coerced number and boolean env values through the security proxy

Lock the Nuxt security proxy so schema-key reads return the coerced validation target. A key declared as `"number"` or `"boolean"` returns a number or boolean at runtime, not a raw string from Nuxt runtime config / `__NUXT__`.

```ts
import { arkenv } from "@arkenv/nuxt";

export const env = arkenv({
  NUXT_PUBLIC_PORT: "number",
  PORT: "number",
});

// 3000 (number), not "3000" (string)
env.NUXT_PUBLIC_PORT;
env.PORT;
```
