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
Implement an automatic coercion layer in `arkenv` that runs before ArkType validation. This layer will inspect the provided schema definition and, where possible, convert string environment variables into their target primitive types (number, boolean) so that ArkType can validate them as such.

This approach allows `arkenv` to support "native" feeling environment variables while leveraging ArkType's powerful validation for the final values.
