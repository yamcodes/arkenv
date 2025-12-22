---
"arkenv": patch
---

### Schema-Directed Coercion

Refactored the core coercion engine from a "Global schema transformer" to **Schema-Directed Coercion**.

This new implementation uses public ArkType introspection (`.in.json`) to surgically identify numeric and boolean targets and apply coercion via a standard `.pipe()`. This eliminates all dependencies on ArkType's internal APIs (`.internal`, `.transform`, etc.), ensuring long-term stability.

* **Performance**: Introspection happens once; data pre-processing is a highly optimized shallow traversal.
* **Reliability**: No longer reaches into undocumented internal nodes.
