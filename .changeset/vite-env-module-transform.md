---
"@arkenv/vite-plugin": minor
---

#### Add `env.ts` transform for Vite fullstack apps

Let the Vite plugin discover your `env.ts` and expose a shared `env` object that works in both client and server code. On the client, public (`VITE_*`) values are inlined at build time and server-only keys throw if read; on the server/SSR, `env.ts` still runs normally and validates against the real environment at boot. The plugin does not rewrite your `env.ts` file on disk.

Works with `@arkenv/vite-plugin` and `@arkenv/vite-plugin/standard`.

Usage:

```ts
// vite.config.ts
import arkenv from "@arkenv/vite-plugin";

export default {
  plugins: [arkenv()], // finds src/env.ts or env.ts
  // or: arkenv({ schemaPath: "src/env.ts", clientPrefix: "VITE_" })
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

```ts
import { env } from "./env";

env.VITE_API_URL; // available on client and server
env.DATABASE_URL; // server only — throws if read in the browser
```

Passing a schema to `arkenv(schema)` (the previous `import.meta.env` define API) continues to work unchanged.
