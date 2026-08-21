---
"@arkenv/vite-plugin": major
"@arkenv/bun-plugin": major
---

#### Remove the schema/define plugin API

Drop `arkenv(schema)` / native-accessor `define` rewriting and the ambient helpers (`ImportMetaEnvAugmented`, `ProcessEnvAugmented`). Vite and Bun plugins only accept transform options and rewrite `env.ts` in the client graph.

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

**BREAKING CHANGE**: Replace `arkenv(schema)` plus `import.meta.env` / `process.env` with `arkenv()` and `import { env } from "./env"`.
