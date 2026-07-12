---
"@arkenv/build": major
"@arkenv/nextjs": minor
"@arkenv/nuxt": minor
"@arkenv/bun-plugin": minor
"@arkenv/vite-plugin": minor
---

#### Add configurable build logging to framework integrations

Add optional `logger` and `logLevel` to Next.js, Nuxt, Vite, and Bun integrations. Set `ARKENV_LOG_LEVEL` when no custom logger is provided.

```ts
import { withArkEnv } from "@arkenv/nextjs/config";

export default withArkEnv(nextConfig, {
  logLevel: "warn",
});
```

```ts
import arkenv from "@arkenv/vite-plugin";

export default defineConfig({
  plugins: [arkenv(Env, { logLevel: "silent" })],
});
```

```ts
import arkenv from "@arkenv/bun-plugin";

await Bun.build({
  plugins: [arkenv(Env, { logLevel: "warn" })],
});
```

**BREAKING CHANGE**: Remove `@arkenv/build/log`. Configure logging via your framework integration, or import the shared `Logger` type from `@arkenv/build`.
