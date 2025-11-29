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

## Decisions

### Decision: Use Preprocessing for Coercion
We decided to implement coercion as a preprocessing step that runs *before* ArkType validation, rather than using ArkType's native "morphs" or scope-level overrides.

**Rationale:**
1.  **Scope Limitations**: As confirmed by the ArkType creator, there is no mechanism to apply a morph to an entire scope (e.g., "all numbers"). We would have to manually override `number` and every subtype (`number.port`, `number.epoch`, etc.), which is brittle and unscalable.
2.  **Separation of Concerns**: Coercion (parsing a string into a primitive) is distinct from Validation (checking if that primitive meets criteria). Keeping coercion separate allows `arkenv` to handle the "environment variable boundary" explicitly, ensuring that `number` in the schema always validates a real JavaScript number.
3.  **Complexity**: Implementing type-level mapping for global coercion would introduce significant complexity to the types, whereas a runtime preprocessor is straightforward and easier to maintain.

**Alternatives Considered:**
*   **ArkType Morphs**: We considered using `type("string").pipe(...)` or overriding keywords in the scope. This was rejected because it requires manual per-type configuration or complex scope manipulation that doesn't propagate to sub-keywords.
*   **Manual Parsing**: Continuing with the current state where users manually pipe string types. This was rejected as it degrades developer experience.

## Risks / Trade-offs
*   **String Definitions**: This approach relies on inspecting the schema definition. It works best when users provide string definitions (e.g., `{ PORT: "number" }`). If a user provides a pre-compiled `type("number")`, we cannot easily inspect it to apply coercion, meaning those values might remain strings and fail validation. We will document this limitation.

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
