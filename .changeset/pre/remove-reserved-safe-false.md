---
"@arkenv/core": major
"@arkenv/standard": major
---

#### Remove reserved `safe` from main-factory config

`ArkEnvConfig` and `StandardEnvConfig` no longer declare the reserved
`safe?: false` field. Safe-mode parsing stays on the `/safe` subpaths.

```ts
import arkenv from "@arkenv/core";
import arkenvSafe from "@arkenv/core/safe";

export const env = arkenv({
  PORT: "number.port = 3000",
});

const result = arkenvSafe(
  { PORT: "number.port" },
  { env: { PORT: "invalid" } },
);
```

`@arkenv/standard` mirrors the same shape via `@arkenv/standard/safe`.

**BREAKING CHANGE**: Passing `safe: false` on the main `arkenv()` config
is no longer accepted. Delete the property; use `/safe` for result-object
parsing.

```diff
- export const env = arkenv(schema, { safe: false });
+ export const env = arkenv(schema);
```
