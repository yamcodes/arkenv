---
"@arkenv/core": patch
---

#### Restore keyword suggestions inside inline schemas

Typing a partial keyword in an inline schema string suggests ArkType keywords again. `arkenv({ PORT: "n" })` offers `never`, `null`, and `number`, the same list as `type({ PORT: "n" })`. The same suggestions are back on `arkenv` from `@arkenv/core/safe`.

A public overload that accepted either an inline schema or a compiled `type()` schema was in the way. With it present, the language service only suggested the characters already typed (`"n"` suggested `n`, `"num"` suggested `num`). Property autocomplete on the parsed `env` object was already working.

Inline objects and compiled `type()` schemas still typecheck. That overload was the one that also accepted a variable typed as the union of those two shapes. That union was not a supported way to call `arkenv`.

```ts
import arkenv from "@arkenv/core";

export const env = arkenv({
	PORT: "number.port = 3000",
	HOST: "string.host",
});
```
