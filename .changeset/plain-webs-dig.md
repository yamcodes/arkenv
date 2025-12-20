---
"@repo/scope": patch
---

#### Scope-based Coercion

Implemented automatic coercion for `number` and `boolean` types within the ArkEnv scope.
- `number`: Now accepts string inputs (e.g., "123") and coerces them to numbers. This applies to sub-keywords like `number.integer` and `number.port` as well.
- `boolean`: Now accepts "true" and "false" strings and coerces them to booleans.
