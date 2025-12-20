# Coercion

## Problem
Environment variables are always strings at runtime, but users want to treat them as typed primitives without manual conversion.

**Current state:**
```typescript
// Manual conversion required
const env = arkenv({
  PORT: type("string").pipe(str => Number.parseInt(str, 10)),
  DEBUG: type("string").pipe(str => str === "true")
});
```

**Desired state:**
```typescript
// Coercion
const env = arkenv({
  PORT: "number",           // "3000" → 3000
  DEBUG: "boolean",        // "true" → true  
  TIMESTAMP: "number.epoch" // "1640995200000" → 1640995200000
});
```

## Solution
## Solution
Configure the ArkEnv scope (`$`) to natively support coercion for `number` and `boolean` keywords. By overriding these keywords in the scope used by `arkenv`, we ensure that any usage of `"number"` or `"boolean"`—whether in a raw schema object or a pre-compiled `type()`—automatically accepts string values and coerces them to the correct primitive type.

This approach ensures a consistent behavior where `arkenv({ PORT: "number" })` and `arkenv(type({ PORT: "number" }))` both work as expected.
