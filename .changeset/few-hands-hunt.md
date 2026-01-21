---
"@arkenv/vite-plugin": patch
---

#### Support configuration

Add support for an optional configuration object as the second argument. This allows you to set the `validator` mode to `"standard"`, enabling support for libraries like Zod or Valibot without an ArkType dependency.

```ts
import { z } from "zod";
import arkenvVitePlugin from "@arkenv/vite-plugin";

arkenvVitePlugin({
  VITE_API_URL: z.string().url()
}, {
  validator: "standard"
})
```
