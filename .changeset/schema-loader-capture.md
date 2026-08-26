---
"@arkenv/core": minor
"@arkenv/standard": minor
"arkenv": minor
---

#### Inspect `env.ts` from the CLI without validating the environment

Your schema file does **not** change. Keep writing:

```ts
import { arkenv } from "@arkenv/core";

export const env = arkenv({
  DATABASE_URL: "string",
  PORT: "number = 3000",
});
```

The ArkEnv CLI can now load that module and read declared keys even when `process.env` is empty. `arkenv()` still validates as usual when the app runs.
