---
"@arkenv/standard": minor
---

#### Add optional `toJsonSchema` coercion callback

Add an optional `toJsonSchema` coercion callback to the config object. This is needed to enable coercion for some validators like Valibot and Zod Mini (which omit per-field JSON Schema to save space).

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

Note: ArkType and Zod v4.2+ do not need this - it already exposes JSON Schema and never reaches the callback. For Zod Mini, use `z.toJSONSchema(schema as z.ZodMiniType, { io: "input", target: "draft-07" })`.
