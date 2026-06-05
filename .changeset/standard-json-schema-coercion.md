---
"arkenv": patch
---

#### Add opt-in Standard JSON Schema coercion to `arkenv/standard`

Introduce opt-in type coercion for standard mode (`arkenv/standard`). This coercion only works if the validator is a standard JSON Schema compliant validator (e.g., Zod, Valibot, or custom schemas that implement the `StandardJSONSchemaV1` interface). This enables coercion for environment variables without relying on ArkType's runtime footprint.

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
