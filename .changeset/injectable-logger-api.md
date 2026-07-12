---
"@arkenv/build": minor
"@arkenv/nextjs": minor
"@arkenv/nuxt": minor
"@arkenv/bun-plugin": minor
"@arkenv/vite-plugin": minor
"arkenv": minor
---

#### Add injectable logger API across build integrations

Introduce `@repo/log` as the shared logging layer with level thresholds, `ARKENV_LOG_LEVEL`, and custom logger injection. Build integrations (`@arkenv/build`, `@arkenv/nextjs`, `@arkenv/nuxt`, `@arkenv/bun-plugin`, `@arkenv/vite-plugin`) accept optional `logger` and `logLevel` options. Remove the `@arkenv/build/log` re-export shim.

**Breaking changes (v1 alpha):**

- Remove the `@arkenv/build/log` conditional export — import log helpers from `@repo/utils/log` or configure logging via integration options.
- `@arkenv/build` now re-exports the shared `Logger` type (`error`, `warn`, `info`, `debug`) instead of the previous minimal watcher callback shape.

Usage:

```ts
import { withArkEnv } from "@arkenv/nextjs/config";

export default withArkEnv(nextConfig, {
  logLevel: "warn",
});
```

```ts
import arkenv from "@arkenv/vite-plugin";

export default defineConfig({
  plugins: [
    // Pass `undefined` for arkenvConfig when only configuring logging
    arkenv(schema, undefined, { logLevel: "silent" }),
  ],
});
```

```ts
import arkenv from "@arkenv/bun-plugin";

export default {
  plugins: [arkenv(schema, undefined, { logLevel: "warn" })],
};
```
