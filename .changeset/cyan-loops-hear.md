---
"arkenv": minor
---

### Schema-Directed Coercion

Introduced **Schema-Directed Coercion**, a robust new system for handling environment variable transformations.

* **Automatic Coercion**: Environment variables defined as `number` or `boolean` in your schema are now automatically coerced from strings.
* **Standard-Based**: Uses standard JSON Schema introspection (`.toJsonSchema()`) to identify coercion targets safely and reliably.
* **Performance**: Optimized traversal ensures high-performance processing without internal mutations.
