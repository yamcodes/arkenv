---
"@arkenv/core": patch
---

#### Restore inline schema completions

Inline `arkenv({ KEY: "..." })` schemas complete ArkType DSL keywords again. A catch-all overload was hiding the contextual type that powers those suggestions. The safe entry from `@arkenv/core/safe` uses the same signatures.
