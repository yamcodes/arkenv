---
"@arkenv/core": major
---

#### Move issue helpers and safe parsing off the default `@arkenv/core` import

The default `@arkenv/core` import is now the throw path only. `formatIssues`,
`getSchemaKeys`, and the `EnvIssue` types moved to `@arkenv/core/issues`.
`{ safe: true }` is no longer accepted on `arkenv()`; use `tryArkenv` from
`@arkenv/core/safe` instead.

```ts
import arkenv from "@arkenv/core";
import { formatIssues } from "@arkenv/core/issues";
import { tryArkenv } from "@arkenv/core/safe";

export const env = arkenv({
  PORT: "number.port = 3000",
});

const result = tryArkenv(
  { PORT: "number.port" },
  { env: { PORT: "invalid" } },
);

if (!result.success) {
  console.error(formatIssues(result.issues));
}
```

`@arkenv/core` now sets `"sideEffects": false` so bundlers can tree-shake
unused subpaths.

**BREAKING CHANGE**: Issue helpers moved to `@arkenv/core/issues`, and
`{ safe: true }` is now `tryArkenv` from `@arkenv/core/safe`.

```diff
- import arkenv, { formatIssues } from "@arkenv/core";
- const result = arkenv(schema, { safe: true });
+ import arkenv from "@arkenv/core";
+ import { formatIssues } from "@arkenv/core/issues";
+ import { tryArkenv } from "@arkenv/core/safe";
+ const result = tryArkenv(schema);
```
