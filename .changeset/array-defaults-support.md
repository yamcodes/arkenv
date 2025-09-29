---
"arkenv": minor
---

#### Support array defaults using type().default() syntax

Fix to an issue where `type("array[]").default(() => [...])` syntax was not accepted by `createEnv` due to overly restrictive type constraints. The function now accepts any string-keyed record while still maintaining type safety through ArkType's validation system.

**New Features:**
- Array defaults to empty using `type("string[]").default(() => [])` syntax
- Support for complex array types with defaults
- Mixed schemas combining string-based and type-based defaults

**Examples:**
```typescript
const env = arkenv({
  ALLOWED_ORIGINS: type("string[]").default(() => ["localhost"]),
  FEATURE_FLAGS: type("string[]").default(() => []),
  PORT: "number.port",
});
```
