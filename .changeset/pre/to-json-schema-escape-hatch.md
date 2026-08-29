---
"@arkenv/standard": minor
---

#### Add optional `toJsonSchema` coercion callback

Add an optional `toJsonSchema` coercion callback to the config object. Use it when a Standard Schema validator has no Standard JSON Schema on the value.

```ts
import arkenv from "@arkenv/standard";
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";

export const env = arkenv(
  { PORT: v.number(), DEBUG: v.boolean() },
  {
    toJsonSchema: (schema) =>
      toJsonSchema(schema as v.GenericSchema, {
        typeMode: "input",
        target: "draft-07",
      }),
  },
);
```

Examples include:

- Validators that keep conversion in separate helpers to save space like Valibot (above) and Zod Mini — use `z.toJSONSchema(schema as z.ZodMiniType, { io: "input", target: "draft-07" })`
- Validators that are Standard Schema, but not Standard JSON Schema like Zod v3 (3.24+) — use `zodToJsonSchema(schema as z.ZodTypeAny, { $refStrategy: "none" })` from `zod-to-json-schema`

Note: ArkType and Zod v4.2+ do not need this — they already expose JSON Schema and never reach the callback.
