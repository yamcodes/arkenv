# Coercion via Global Schema Transformer

To support environment variable coercion (e.g. parsing strings to numbers/booleans at runtime) without breaking ArkType's refinement syntax. ArkType's parser cannot apply numeric/boolean constraints (like `number >= 18` or `number % 2`) to non-numeric nodes (morphs). Instead of applying morphs directly to base types, we keep the core primitives clean and apply a global schema transformer inside `createEnv` by using `schema.transform()`. This walks the parsed schema and wraps leaf nodes with the appropriate coercion morphs, preserving the ability to validate ranges and other refinements.

---

**Archived Specs**:

- [2025-12-20-add-coercion](../openspec/changes/archive/2025-12-20-add-coercion/)
- [2025-12-22-coercion-public-api](../openspec/changes/archive/2025-12-22-coercion-public-api/)
