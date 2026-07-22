---
"@arkenv/bun-plugin": patch
---

#### Show a Zod example when Standard Mode cannot find `env.ts`

When `@arkenv/bun-plugin/standard` fails because no schema file exists, the error now shows an `@arkenv/standard` + Zod starter instead of an ArkType one:

```ts
import arkenv from "@arkenv/standard";
import { z } from "zod";

export default arkenv({
  BUN_PUBLIC_API_URL: z.string(),
  BUN_PUBLIC_DEBUG: z.boolean(),
});
```
