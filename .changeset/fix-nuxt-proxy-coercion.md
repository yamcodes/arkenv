---
"@arkenv/nuxt": patch
---

#### Fix security proxy returning raw strings instead of coerced values

Prefer the coerced validation target for schema-key reads instead of re-reading raw `useRuntimeConfig()`, `process.env`, or `__NUXT__.config.public` strings. Those sources still feed validation at create time, but serving them again on get silently undid coercion (for example a `number` key returning a `string`).

```ts
import { createEnv } from "@arkenv/nuxt";

export const env = createEnv({
  NUXT_PUBLIC_PORT: "number",
  PORT: "number",
});

// env.NUXT_PUBLIC_PORT and env.PORT are numbers, not "3000"
```
