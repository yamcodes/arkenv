---
"@arkenv/vite-plugin": patch
"@arkenv/bun-plugin": patch
---

#### Internal refactoring to reduce type duplication

Refactor the plugins to re-use internal types like `FilterByPrefix` and `InferType`, defined in the core internal types package.

This should have no effect for the end-user.
