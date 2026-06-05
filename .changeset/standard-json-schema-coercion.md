---
"arkenv": minor
---

#### Add Standard JSON Schema coercion to `arkenv/standard`

Introduce opt-out type coercion for standard mode (`arkenv/standard`). This coercion only works if the validator is a standard JSON Schema compliant validator (e.g., Zod, Valibot, or custom schemas that implement the `StandardJSONSchemaV1` interface). This automatically enables coercion for environment variables without relying on ArkType's runtime footprint.

If you need to disable coercion, explicitly pass `{ coerce: false }` in your configuration:

```ts
import arkenv from "arkenv/standard";
import { z } from "zod";

const env = arkenv(
  { PORT: z.number() },
  { coerce: false }
);
```

BREAKING CHANGE: Coercion is now enabled by default in `arkenv/standard`. This will automatically coerce environment variables to their expected types (e.g., strings containing numbers, booleans, or dates will be converted to their respective types) based on the JSON Schema of your validators. It's unlikely to affect you unless you were relying on validation failing for uncoerced string inputs, or have custom schemas that expect raw strings instead of coerced values.
