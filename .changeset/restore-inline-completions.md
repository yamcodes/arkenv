---
"@arkenv/core": patch
---

#### Restore inline ArkType DSL completions

A partial keyword inside an inline schema suggests ArkType keywords again. `"n"` completes to `never`, `null`, and `number`, the same suggestions as `type({ ... })`. This applies to `arkenv` from `@arkenv/core` and from `@arkenv/core/safe`.

Supported calls are unchanged: an inline object, or a compiled `type()` schema. The catch-all overload that also accepted a variable typed as the union of those two shapes is gone. That union was not a supported way to call `arkenv`.

```ts
import arkenv from "@arkenv/core";

export const env = arkenv({
  PORT: "number.port = 3000",
  HOST: "string.host",
});
```
