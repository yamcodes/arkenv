---
"arkenv": patch
---

#### Add opt-in Standard JSON Schema coercion to `arkenv/standard`

Introduce opt-in, best-effort type coercion for standard mode (`arkenv/standard`). This enables coercion for environment variables without relying on ArkType's runtime footprint by leveraging the `StandardJSONSchemaV1` specification.

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
		coerce: true, // Enables Standard JSON Schema-based coercion
	}
);
```
