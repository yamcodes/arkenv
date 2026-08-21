---
"@arkenv/vite-plugin": major
"@arkenv/bun-plugin": major
---

#### Remove the schema/define plugin API

The `arkenv(schema)` pattern has been dropped, along with native-accessor `define` rewriting and the ambient helpers (`ImportMetaEnvAugmented`, `ProcessEnvAugmented`). Vite and Bun plugins now only accept transform options and rewrite `env.ts` in the client graph.

Usage:

```ts
import arkenv from "@arkenv/vite-plugin";

export default {
  plugins: [arkenv()],
};
```

```ts
import { env } from "./env";

env.VITE_API_URL;
```

**BREAKING CHANGE**: `arkenv(schema)` plus `import.meta.env` / `process.env` is no longer supported. Use `arkenv()` and `import { env } from "./env"` instead.
