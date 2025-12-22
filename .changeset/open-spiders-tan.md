---
"@repo/scope": minor
---

#### Align scope with central coercion

* **BREAKING**: Removed the custom `boolean` keyword from the root scope. ArkEnv now uses the standard ArkType `boolean` primitive combined with global coercion.
* Updated `number.port` to use the new strict numeric refinement, as string parsing is now handled by global coercion.
