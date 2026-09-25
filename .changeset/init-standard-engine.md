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

Re-running init replaces the other engine's entry. A Nuxt app that still registers `@arkenv/nuxt/module` switches to `@arkenv/nuxt/standard/module` when you choose Zod or Valibot, and the same replacement applies to the Next.js, Vite, and Rsbuild imports. Choosing ArkType switches those entries back.

ArkType init is unchanged: it still installs `arktype` and uses the ArkType integration entry.
