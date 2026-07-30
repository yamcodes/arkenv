---
"@arkenv/bun-plugin": minor
---

#### Add `env.ts` transform for Bun fullstack apps

Let the Bun plugin discover your `env.ts` and expose a shared `env` object that works in both client and server code. On the client (`Bun.build` / `[serve.static]`), public (`BUN_PUBLIC_*`) values are inlined at build time and server-only keys throw if read; on the server (`bun run` / `Bun.serve`), `env.ts` still runs normally and validates against the real environment at boot. The plugin does not rewrite your `env.ts` file on disk.

Works with `@arkenv/bun-plugin` and `@arkenv/bun-plugin/standard`.

Usage:

```ts
// bunfig.toml — zero-config browser transform
// [serve.static]
// plugins = ["@arkenv/bun-plugin"]

// or explicitly in Bun.build:
import arkenv from "@arkenv/bun-plugin";

await Bun.build({
  entrypoints: ["./src/index.html"],
  target: "browser",
  plugins: [arkenv], // finds src/env.ts or env.ts
  // or: arkenv({ schemaPath: "src/env.ts", clientPrefix: "BUN_PUBLIC_" })
});
```

```ts
// src/env.ts
import arkenv from "@arkenv/core";

export const env = arkenv({
  DATABASE_URL: "string",
  BUN_PUBLIC_API_URL: "string",
});
```

```ts
import { env } from "./env";

env.BUN_PUBLIC_API_URL; // available on client and server
env.DATABASE_URL; // server only — throws if read in the browser
```

Passing a schema to `arkenv(schema)` (the previous `process.env` rewrite API) continues to work unchanged as SPA mode.
