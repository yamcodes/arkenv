---
"arkenv": patch
"@arkenv/standard": patch
---

#### Drop default `z.coerce` from Zod product samples and scaffold templates

Scaffolded Zod templates, `@arkenv/standard` JSDoc examples, and official example projects now declare numeric and boolean fields with `z.number()` and `z.boolean()` instead of `z.coerce.number()` or `z.coerce.boolean()`, reflecting ArkEnv's built-in pre-coercion for Standard Schema validators.

```ts
import arkenv from "@arkenv/standard";
import { z } from "zod";

export const env = arkenv({
  PORT: z.number().default(3000),
  DATABASE_URL: z.string().url(),
  DEBUG: z.boolean().default(false),
});
```
