---
"@arkenv/vite-plugin": major
"@arkenv/bun-plugin": major
"@arkenv/rsbuild-plugin": major
---

#### Reject runtime validation options on bundler plugins

Vite, Bun, and Rsbuild plugins now accept only build-time options: `schemaPath`, `clientPrefix`, `logger`, `logLevel`, and `env`. `env` is a build-time override merged over the loaded environment before `env.ts` is evaluated.

```ts
import { arkenvPlugin } from "@arkenv/vite-plugin";

export default {
  plugins: [
    arkenvPlugin({
      schemaPath: "src/env.ts",
      env: { VITE_API_URL: "https://api.example.com" },
    }),
  ],
};
```

Set `coerce`, `onUndeclaredKey`, `arrayFormat`, `emptyAsUndefined`, `debugSecrets`, and `toJsonSchema` on `arkenv()` in `env.ts`. The plugin rejects those keys.

```ts
import arkenv from "@arkenv/core";

export const env = arkenv(
  { PORT: "number" },
  { coerce: true, onUndeclaredKey: "reject" },
);
```

**BREAKING CHANGE**: Plugin option types no longer include runtime `arkenv()` fields other than `env`. Passing them now throws instead of being ignored.

```diff
- arkenvPlugin({ coerce: true })
+ arkenvPlugin({ env: { PORT: "3000" } })
```
