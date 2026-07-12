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
    arkenv(schema, undefined, { logLevel: "silent" }),
  ],
});
```
