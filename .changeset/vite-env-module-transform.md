---
"@arkenv/vite-plugin": minor
---

#### Add env-module transform for fullstack Vite apps

Enable `import { env } from "./env"` as the canonical surface: the plugin rewrites `env.ts` in the client graph (inlined coerced literals + server-key guards) and leaves it untouched in the SSR graph for boot-time validation.

```ts
// vite.config.ts / app.config.ts
import arkenv from "@arkenv/vite-plugin";

export default {
  plugins: [
    arkenv(), // or arkenv({ schemaPath: "src/env.ts", clientPrefix: "VITE_" })
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

SPA mode (`arkenv(schema)` + `ImportMetaEnvAugmented` for `import.meta.env`) remains supported.
