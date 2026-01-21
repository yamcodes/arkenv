---
"@arkenv/bun-plugin": patch
---

#### Support configuration

Add support for an optional configuration object as the second argument. This allows you to set the `validator` mode to `"standard"`, enabling support for libraries like Zod or Valibot without an ArkType dependency.

```ts
import { z } from "zod";
import arkenv from "@arkenv/bun-plugin";

arkenv({
  BUN_PUBLIC_API_URL: z.string().url()
}, {
  validator: "standard"
})
```
