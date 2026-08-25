---
"@arkenv/core": minor
"@arkenv/standard": minor
"arkenv": minor
---

#### Add schema capture for inspecting `env.ts` without validating the environment

`arkenv()` can now record schema definitions instead of reading `process.env`. The CLI uses this to load a project's flat `env.ts` and return declared keys (and per-key schemas) even when the environment is empty.

```ts
import { arkenv, beginSchemaCapture, endSchemaCapture } from "@arkenv/core";

beginSchemaCapture();
arkenv({
  DATABASE_URL: "string",
  PORT: "number = 3000",
});
const definitions = endSchemaCapture();
// definitions[0] is `{ DATABASE_URL: "string", PORT: "number = 3000" }`
```
