---
"@arkenv/core": major
"@arkenv/standard": major
---

#### Remove reserved `safe?: false` from public config

`ArkEnvConfig` and `StandardEnvConfig` no longer declare a reserved
`safe?: false` field. Safe mode remains available only via
`@arkenv/core/safe` and `@arkenv/standard/safe`.

**BREAKING CHANGE**: Passing `{ safe: false }` (or any `safe` property)
on the main `arkenv()` config is now a type error. Delete the property.
For a result object instead of a throw, import `arkenv` from the `/safe`
subpath:

```diff
  import arkenv from "@arkenv/core";
- export const env = arkenv(schema, { safe: false });
+ export const env = arkenv(schema);

  // For a result object:
- // (was never supported as `{ safe: true }` on the main entry)
+ import arkenv from "@arkenv/core/safe";
+ const result = arkenv(schema);
```
