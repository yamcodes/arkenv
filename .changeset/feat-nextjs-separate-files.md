---
"@arkenv/nextjs": minor
---

#### Implement Next.js separate files mode and native extends API

Introduces dedicated entry points for `@arkenv/nextjs/server` and `@arkenv/nextjs/client` to prevent metadata leakage and support compile-time bundler-enforced isolation. Adds a native `extends` API to merge validated outputs of extended proxies while maintaining proxy-level protections.

Example server usage:
```ts
import { createEnv } from "@arkenv/nextjs/server";
import { env as clientEnv } from "./env.client";

export const env = createEnv({
  server: {
    DATABASE_URL: "string",
  },
  extends: [clientEnv],
  runtimeEnv: {},
});
```

Example client usage:
```ts
import { createEnv } from "@arkenv/nextjs/client";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_URL: "string",
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
});
```
