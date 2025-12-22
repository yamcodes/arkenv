---
"arkenv": patch
---

### Selective Path Coercion

Refactored the core coercion engine from a "Global schema transformer" to **Selective Path Coercion**.

This high-performance, non-destructive data pre-processor uses public ArkType introspection (`.in.json`) to selectively coerce environment variables without touching schema internals. It identifies numeric and boolean targets at boot time and applies transformation via a standard public `.pipe()` morph.

This change eliminates all dependencies on undocumented ArkType internal APIs (`.internal`, `.transform`, etc.), significantly improving the stability and future-readiness of the library.

* **Behavior**: Retains 100% compatibility with existing coercion logic for strings, numbers, booleans, and complex unions.
* **Internal**: removed all usage of `.internal.transform()` and node-specific introspection properties.
