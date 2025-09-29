---
"arkenv": minor
---

Support array defaults using type().default() syntax

Fixes an issue where `type("array[]").default(() => [...])` syntax was not accepted by `createEnv` due to overly restrictive type constraints. The function now accepts any string-keyed record while still maintaining type safety through ArkType's validation system.

**Breaking Changes:** None - this is a pure addition of functionality.

**New Features:**
- Array defaults using `type("string[]").default(() => ["localhost"])` syntax
- Support for complex array types with defaults
- Mixed schemas combining string-based and type-based defaults

**Examples:**
```typescript
const env = arkenv({
  ALLOWED_ORIGINS: type("string[]").default(() => ["localhost"]),
  FEATURE_FLAGS: type("string[]").default(() => []),
  PORTS: type("number[]").default(() => [3000, 8080]),
});
```