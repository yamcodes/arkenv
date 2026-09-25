---
"@arkenv/vite-plugin": major
"@arkenv/bun-plugin": major
"@arkenv/rsbuild-plugin": major
---

#### Reject runtime options on bundler plugins

Vite, Bun, and Rsbuild plugins now accept only `schemaPath`, `clientPrefix`, `logger`, and `logLevel`. The build validates the environment loaded for that compile. Variables already set on `process.env` win over env files.

```ts
import { arkenvPlugin } from "@arkenv/vite-plugin";

export default {
  plugins: [arkenvPlugin({ schemaPath: "src/env.ts" })],
};
```

Set `env`, `coerce`, `onUndeclaredKey`, `arrayFormat`, `emptyAsUndefined`, `debugSecrets`, and `toJsonSchema` on `arkenv()` in `env.ts`. The plugin rejects those keys.

```ts
import arkenv from "@arkenv/core";

export const env = arkenv(
  { PORT: "number" },
  { coerce: true, onUndeclaredKey: "reject" },
);
```

**BREAKING CHANGE**: Plugin option types no longer include runtime `arkenv()` fields, including `env`. Passing them now throws.

```diff
- arkenvPlugin({ env: { PORT: "3000" }, coerce: true })
+ arkenvPlugin({ schemaPath: "src/env.ts" })
```
