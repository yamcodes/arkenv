---
"@arkenv/nextjs": minor
"@arkenv/nuxt": minor
---

#### Add flat-layout overload and `createEnv` named export to standard mode integrations

Introduce flat-layout signature overloads to `@arkenv/nextjs/standard` and `@arkenv/nuxt/standard`, enabling Standard Schema users (e.g., Zod, Valibot) to use the same flat environment structure as the core ArkType mode.

Also export `createEnv` from all `@arkenv/nextjs/standard` and `@arkenv/nuxt/standard` subpaths.

Usage:

```ts
import { createEnv } from "@arkenv/nextjs/standard";
import { z } from "zod";

export const env = createEnv({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
}, {
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
});
```
