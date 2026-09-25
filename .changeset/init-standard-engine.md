---
"arkenv": patch
---

#### Scaffold Zod and Valibot init on standard mode

`arkenv init` no longer installs `arktype` when you choose Zod or Valibot. Next.js, Nuxt, Vite, Rsbuild, and Bun now scaffold the `/standard` integration entry, and Next.js and Nuxt also install `@arkenv/standard`.

```ts
import arkenv from "@arkenv/nuxt/standard";
import * as z from "zod";

export const env = arkenv({
  DATABASE_URL: z.url(),
});
```

ArkType init is unchanged: it still installs `arktype` and uses the ArkType integration entry.
