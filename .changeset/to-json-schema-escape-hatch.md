---
"@arkenv/standard": minor
---

#### Add optional `toJsonSchema` coercion escape hatch

Pass `toJsonSchema` when a Standard Schema validator does not embed JSON Schema on the value. ArkEnv calls it per key when it cannot read JSON Schema from that value.

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

- Return a plain object to coerce that key; return `undefined` to skip only that key
- Throwing or returning a non-plain object fails the parse with `ArkEnvError` (`INVALID_SCHEMA`) for that key
- Zod and other Standard JSON Schema validators are unchanged (callback is not invoked when JSON Schema is already on the value)
