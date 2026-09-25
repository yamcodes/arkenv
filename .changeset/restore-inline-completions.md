---
"@arkenv/core": patch
---

#### Restore inline ArkType DSL completions

A partial keyword inside an inline schema suggests ArkType keywords again. `"n"` completes to `never`, `null`, and `number`, the same suggestions as `type({ ... })`. This applies to `arkenv` from `@arkenv/core` and from `@arkenv/core/safe`.

```ts
import arkenv from "@arkenv/core";

export const env = arkenv({
	PORT: "number.port = 3000",
	HOST: "string.host",
});
```
