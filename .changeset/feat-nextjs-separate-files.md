---
"@arkenv/nextjs": patch
"@arkenv/cli": patch
---

#### Implement Next.js separate files mode, shared entry point, and native extends API

Introduce dedicated entry points for `@arkenv/nextjs/server`, `@arkenv/nextjs/client`, and `@arkenv/nextjs/shared` to prevent metadata leakage and support compile-time bundler-enforced isolation. Add a native `extends` API to merge validated outputs of extended proxies while maintaining proxy-level protections.

Also update the CLI `init` wizard to support interactive layout selection (Strict 3-file vs Simple 1-file) and `--strict` / `--simple` flags to bypass interactive selection.

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
