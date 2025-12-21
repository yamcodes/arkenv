---
"@repo/scope": minor
---

#### Simplify `number.port` and remove `boolean` from custom scope

*   **BREAKING**: The `boolean` keyword has been removed from the root scope. ArkEnv now uses the standard ArkType `boolean` definition and applies coercion globally.
*   The `number.port` keyword has been simplified to handle numbers only, since coercion is now handled at the global level:

```ts
type("0 <= number.integer <= 65535")
```
