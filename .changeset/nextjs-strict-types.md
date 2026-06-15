---
"@arkenv/nextjs": minor
---

#### Enforce strict intersection typing on `runtimeEnv` and reject legacy configs

Restored strict intersection types (`Record<RequiredKeys, unknown> & Record<string, unknown>`) on the Next.js `createEnv` adapter to guarantee compile-time enforcement of required schema keys. Additionally, narrowed the accepted `runtimeEnv` record value type to `string | undefined` to actively reject invalid configurations.

**BREAKING CHANGE**: If you were using the legacy Next.js `env` object configuration (e.g., passing a nested object to `runtimeEnv`), or if you were failing to explicitly map all required keys into `runtimeEnv`, your build will now fail with a TypeScript error. You must explicitly map all variables referenced in your schema as `string | undefined`.

Usage:

```ts
import { createEnv } from "@arkenv/nextjs";

export const env = createEnv({
  client: { NEXT_PUBLIC_API: "string" },
  runtimeEnv: {
    // TypeScript will error if NEXT_PUBLIC_API is missing,
    // and will also error if you try to pass an object or array.
    NEXT_PUBLIC_API: process.env.NEXT_PUBLIC_API,
  }
});
```
