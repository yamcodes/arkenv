---
"arkenv": patch
---

#### Add Standard JSON Schema coercion to `arkenv/standard`

Introduce opt-out type coercion for standard mode (`arkenv/standard`). This coercion only works if the validator is a standard JSON Schema compliant validator (e.g., Zod, Valibot, or custom schemas that implement the `StandardJSONSchemaV1` interface). This enables coercion for environment variables without relying on ArkType's runtime footprint.

Usage:

```ts
import { createEnv } from "arkenv/standard";
import * as z from "zod";

const env = createEnv(
	{
		PORT: z.number(), // Automatically coerced to number
		HOST: z.string(),
	},
	{
		coerce: true, // Enable Standard JSON Schema-based coercion
	}
);
```

If you need to disable coercion, explicitly pass `{ coerce: false }` in your configuration:

```ts
import arkenv from "arkenv/standard";
import { z } from "zod";

const env = arkenv(
  { PORT: z.number() },
  { coerce: false }
);
```
