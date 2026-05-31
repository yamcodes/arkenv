---
"@arkenv/nextjs": patch
"@arkenv/cli": patch
---

#### Generate tailored `createEnv` factory in Next.js strict layout

Generate a tailored `createEnv` factory helper in `env.gen.ts` when using the strict split-schema layout (instead of exporting a raw `runtimeEnv` object).

This eliminates the need to manually declare or reference the `runtimeEnv` object inside the client schema `client.ts` file, aligning it closer to the core `arkenv` experience of simply calling `createEnv(schema, options)`.

Example usage in `client.ts`:

```ts
import { createEnv } from "./generated/env.gen";
import { SharedSchema } from "./internal/shared";

export const env = createEnv(
	{
		NEXT_PUBLIC_API_URL: "string",
	},
	{
		extends: [SharedSchema],
	},
);
```
