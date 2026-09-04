---
"@arkenv/core": major
"@arkenv/standard": major
---

#### Move issue helpers and safe parsing off the default import

The default `@arkenv/core` and `@arkenv/standard` imports are now the throw
path only. `formatIssues`, `getSchemaKeys`, and the `EnvIssue` types moved
to `@arkenv/core/issues` (core). `{ safe: true }` is no longer accepted on
either package's main `arkenv()`; import `arkenv` from `/safe` instead.

```ts
import arkenv from "@arkenv/core";
import { formatIssues } from "@arkenv/core/issues";
import arkenvSafe from "@arkenv/core/safe";

export const env = arkenv({
  PORT: "number.port = 3000",
});

const result = arkenvSafe(
  { PORT: "number.port" },
  { env: { PORT: "invalid" } },
);

if (!result.success) {
  console.error(formatIssues(result.issues));
}
```

`@arkenv/standard` mirrors the same shape:

```ts
import arkenv from "@arkenv/standard";
import arkenvSafe from "@arkenv/standard/safe";
```

`@arkenv/core` now sets `"sideEffects": false` so bundlers can tree-shake
unused subpaths. Framework packages (Next.js, Nuxt, Vite, Bun) do **not**
ship a `/safe` subpath.

**BREAKING CHANGE**: Issue helpers moved to `@arkenv/core/issues`.
`{ safe: true }` on `arkenv()` is replaced by `arkenv` from
`@arkenv/core/safe` / `@arkenv/standard/safe`.

```diff
- import arkenv, { formatIssues } from "@arkenv/core";
- const result = arkenv(schema, { safe: true });
+ import arkenv from "@arkenv/core";
+ import { formatIssues } from "@arkenv/core/issues";
+ import arkenvSafe from "@arkenv/core/safe";
+ const result = arkenvSafe(schema);
```

```diff
- import arkenv from "@arkenv/standard";
- const result = arkenv(schema, { safe: true });
+ import arkenv from "@arkenv/standard/safe";
+ const result = arkenv(schema);
```
