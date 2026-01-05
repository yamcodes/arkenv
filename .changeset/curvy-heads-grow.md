---
"@repo/keywords": patch
---

#### Add `maybeJson` keyword

JSDoc:

```ts
/**
 * A loose JSON morph.
 *
 * **In**: `unknown`
 *
 * **Out**: A parsed JSON object if the input is a valid JSON string; otherwise the original input.
 *
 * Useful for coercion in unions where failing on non-JSON strings would block other branches.
 */
```