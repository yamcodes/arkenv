---
"@arkenv/core": patch
---

#### Restore keyword suggestions inside inline schemas

A partial keyword in an inline schema string suggests ArkType keywords again. `arkenv({ PORT: "n" })` offers `never`, `null`, and `number`. The same suggestions are back on `arkenv` from `@arkenv/core/safe`.

```ts
import arkenv from "@arkenv/core";

export const env = arkenv({
  PORT: "number.port = 3000",
});
```
