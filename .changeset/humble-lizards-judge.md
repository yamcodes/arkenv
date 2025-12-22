---
"@repo/keywords": minor
---

#### Simplify keywords for central coercion

* **BREAKING**: The `boolean` keyword has been removed. Universal boolean coercion is now handled by the `arkenv` package.
* **BREAKING**: The `port` keyword has been changed from a `string -> number` morph to a pure `number` refinement. Numeric coercion is now handled centrally.
* Added `maybeParsedNumber` and `maybeParsedBoolean` internal morphs to support central coercion (including specific "NaN" support).
