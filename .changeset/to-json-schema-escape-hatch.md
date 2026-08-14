---
"@arkenv/standard": minor
---

#### Add optional `toJsonSchema` for Valibot coercion

Valibot keeps JSON Schema conversion in `@valibot/to-json-schema`. Pass that converter so ArkEnv coerces `v.number()` and `v.boolean()`.

```ts
import arkenv from "@arkenv/standard";
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";

export const env = arkenv(
  { PORT: v.number(), DEBUG: v.boolean() },
  {
    toJsonSchema: (schema: unknown) =>
      toJsonSchema(schema as v.GenericSchema, {
        typeMode: "input",
        target: "draft-07",
      }),
  },
);
```

Return a plain object to coerce that key, or `undefined` to skip it. If the callback throws or returns a non-plain object, ArkEnv fails that key with `ArkEnvError` (`INVALID_SCHEMA`).

Zod keys coerce from JSON Schema on the value. ArkEnv skips the callback for those.
