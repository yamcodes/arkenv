# Design: Coercion

## Architecture
The coercion logic will be implemented as a preprocessing step within the `createEnv` function.

### Flow
1.  **Input**: `createEnv` receives a schema definition (`def`) and an environment object (`env`).
2.  **Inspection**: We inspect `def` to identify keys that expect primitive types (number, boolean) but will receive strings from `env`.
    *   This inspection primarily targets schema definitions provided as plain objects with string values (e.g., `{ PORT: "number" }`).
    *   Complex ArkType definitions (already compiled types) may be skipped or require advanced introspection (out of scope for initial implementation).
3.  **Coercion**:
    *   For each identified key, we check the corresponding value in `env`.
    *   If the target type is `number` (or subtypes like `number.port`, `number.epoch`), we attempt to convert the string to a number using `Number()` or `parseFloat()`.
    *   If the target type is `boolean`, we convert "true" to `true` and "false" to `false`.
4.  **Validation**: The modified `env` object (with coerced values) is passed to the ArkType schema for validation.

### Trade-offs
*   **Preprocessing vs. Morphs**: We chose preprocessing over ArkType morphs because applying morphs globally or modifying the scope for all keywords is complex and discouraged by the ArkType creator. Preprocessing gives us full control over the "environment variable to typed value" boundary.
*   **String Definitions**: This relies on the user providing string definitions (e.g., `"number"`) or simple objects. If the user provides a compiled `type("number")`, we might not be able to easily inspect it to apply coercion. We will document this limitation.

## Implementation Details

### `coerce` Utility
We will create a utility function `coerce(def: Record<string, unknown>, env: Record<string, string | undefined>)` that returns a new environment object.

```typescript
function coerce(def: Record<string, unknown>, env: Record<string, string | undefined>) {
  const coerced = { ...env };
  for (const key in def) {
    const typeDef = def[key];
    if (typeof typeDef === "string") {
      if (typeDef.startsWith("number")) {
        // Coerce to number
      } else if (typeDef === "boolean") {
        // Coerce to boolean
      }
    }
  }
  return coerced;
}
```

### Integration
In `createEnv`:

```typescript
export function createEnv(def, env = process.env) {
  // ...
  const coercedEnv = isPlainObject(def) ? coerce(def, env) : env;
  const validatedEnv = schema(coercedEnv);
  // ...
}
```
