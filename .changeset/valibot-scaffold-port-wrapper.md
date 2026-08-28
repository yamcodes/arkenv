---
"arkenv": patch
---

#### Scaffold Valibot `PORT` as `v.number()` instead of a string transform

`arkenv init` with Valibot already imports `@arkenv/standard/valibot`, which binds `@valibot/to-json-schema` for coercion. Generate `PORT` as a numeric schema so the wrapper can coerce `"3000"` instead of requiring `v.transform(Number)`.

```ts
import { arkenv } from "@arkenv/standard/valibot";
import * as v from "valibot";

export const env = arkenv({
  PORT: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(65535)), 3000),
});
```
