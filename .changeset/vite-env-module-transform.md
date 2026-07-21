---
"@arkenv/vite-plugin": minor
---

#### Add env-module transform for fullstack Vite apps

Make `import { env } from "./env"` the recommended surface for Vite apps that have both client and server code.

With no schema argument, the plugin finds `src/env.ts` / `env.ts` (or `schemaPath`) and:

- **Browser build**: replaces that module with an object of build-validated, coerced literals for client-prefixed keys, plus getters that throw for server-only keys — no `@arkenv/core` / validator code in the client bundle
- **SSR / server build**: leaves the module alone so `createEnv`/`arkenv` still validates against the real deployment environment at boot

Works for both `@arkenv/vite-plugin` (ArkType / `@arkenv/core`) and `@arkenv/vite-plugin/standard`.

```ts
// vite.config.ts / app.config.ts — no schema argument
import arkenv from "@arkenv/vite-plugin";

export default {
  plugins: [
    arkenv(), // auto-discovers src/env.ts or env.ts
    // or: arkenv({ schemaPath: "src/env.ts", clientPrefix: "VITE_" })
  ],
};
```

```ts
// src/env.ts
import arkenv from "@arkenv/core";

export const env = arkenv({
  DATABASE_URL: "string",
  VITE_API_URL: "string",
});
```

The existing `arkenv(schema)` call (validate + Vite `define` for `import.meta.env`) is unchanged and remains available for apps that already use that API.
