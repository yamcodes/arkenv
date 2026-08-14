---
"@arkenv/standard": minor
---

#### Add optional `toJsonSchema` coercion callback

Pass a converter when a Standard Schema field has no JSON Schema on the value. ArkEnv calls it per key then, so number and boolean env strings coerce.

Valibot is one such library (`@valibot/to-json-schema`):

```ts
import arkenv from "@arkenv/standard";
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";

export const env = arkenv(
  { PORT: v.number(), DEBUG: v.boolean() },
  {
    toJsonSchema: (schema) =>
      toJsonSchema(schema, {
        typeMode: "input",
        target: "draft-07",
      }),
  },
);
```

Return a plain object to coerce that key, or `undefined` to skip it. If the callback throws or returns a non-plain object, ArkEnv fails that key with `ArkEnvError` (`INVALID_SCHEMA`).

Keys that already expose JSON Schema (Zod 4.2+) coerce without the callback.
