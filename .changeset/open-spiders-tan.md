---
"@repo/scope": minor
---

#### Simplify generic types for central coercion

*   **BREAKING**: Removed the custom `boolean` keyword from the root scope. ArkEnv now leverages standard ArkType primitives combined with **Selective Path Coercion**.
*   The `number.port` keyword has been simplified to a pure number refinement, delegating string-to-number conversion to the global coercion layer.
