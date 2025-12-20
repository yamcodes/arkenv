---
"arkenv": minor
---

#### Native Coercion Support

Added standard support for coercion using ArkType's scope mechanism.
- `arkenv` now automatically coerces environment variables defined as `number` or `boolean`.
- Use `arkenv({ PORT: "number" })` or `arkenv({ DEBUG: "boolean" })` directly.
- **Breaking**: The `"number"` and `"boolean"` keywords in `arkenv` now perform automatic string coercion. If you require strict validation that *only* accepts number/boolean literals (rejecting strings), use `type` from `arktype` instead.
