---
"@arkenv/nuxt": patch
---

#### Fix number and boolean env values returning as strings

Keep coerced types when reading from `env`. A key declared as `"number"` or `"boolean"` now returns a number or boolean at runtime, not the raw string from Nuxt runtime config.

```ts
import { createEnv } from "@arkenv/nuxt";

export const env = createEnv({
  NUXT_PUBLIC_PORT: "number",
  PORT: "number",
});

// Was "3000" (string) — now 3000 (number)
env.NUXT_PUBLIC_PORT;
env.PORT;
