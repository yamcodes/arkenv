---
"@arkenv/standard": minor
---

#### Add optional `toJsonSchema` coercion callback

Add an optional `toJsonSchema` coercion callback to the config object. This is needed to enable coercion for Standard Schema validators that omit per-field JSON Schema (Valibot and Zod Mini omit it to save space; Zod v3 never exposes Standard JSON Schema on the value).

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

Note: ArkType and Zod v4.2+ do not need this — they already expose JSON Schema and never reach the callback. For Zod Mini, use `z.toJSONSchema(schema as z.ZodMiniType, { io: "input", target: "draft-07" })`. For Zod v3 (`zod` / `zod/v3`), use `zodToJsonSchema(schema as z.ZodTypeAny, { $refStrategy: "none" })` from `zod-to-json-schema`.
