---
"@arkenv/bun-plugin": patch
---

#### Clarify Standard Mode missing-schema guidance with a Zod example

When `@arkenv/bun-plugin/standard` cannot find `env.ts`, show an illustrative Zod starter (any Standard Schema validator works — Zod is just the most common):

```ts
import arkenv from "@arkenv/standard";
import { z } from "zod";

export default arkenv({
  BUN_PUBLIC_API_URL: z.string(),
  BUN_PUBLIC_DEBUG: z.enum(["true", "false"]),
});
```
