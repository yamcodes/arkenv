# Design: Coercion

## Architecture

Coercion will be implemented by enhancing the ArkType scope (`$`) used by `arkenv`.

### Flow
1.  **Scope Definition**: We define custom `number` and `boolean` keywords in the `@repo/scope` package that accept `string` inputs and coerce them to their target types.
2.  **Schema Definition**: When users define a schema using `arkenv({})` or `type({})`, they use these keywords (implicitly or explicitly).
3.  **Validation**: ArkType natively handles the coercion during validation (parse phase), regardless of whether the schema was defined as a raw object or a pre-compiled type.

This architecture ensures consistent behavior across all usage patterns.

## Decisions

### Decision: Use Scope-based Coercion
We decided to implement coercion by overriding the default `number` and `boolean` keywords in the `arkenv` scope (`$`).

**Rationale:**
*   **Consistency**: Works identically for `arkenv({ P: "number" })` and `arkenv(type({ P: "number" }))`.
*   **Simplicity**: Leverages ArkType's native morphing capabilities instead of maintaining a separate manual coercion layer.
*   **Robustness**: Handles edge cases (like `NaN` or invalid booleans) using ArkType's existing validation logic.

**Alternatives considered:**
*   **Preprocessing in `createEnv`**: This was the initial proposal. It was rejected because it couldn't handle pre-compiled `type()` definitions, creating an inconsistent user experience.

## Implementation Details

### `@repo/scope`
We will modify `packages/internal/scope/src/index.ts` to override `number` and `boolean`.

```typescript
// packages/internal/scope/src/index.ts
export const $ = scope({
    // Override number to accept string | number and coerce
    number: type("string | number").pipe(/* coercion logic */),
    
    // Override boolean to accept string | boolean and coerce
    boolean: type("string | boolean").pipe(/* coercion logic */),
    
    // ... other keywords
});
```

### `@repo/keywords`
The actual coercion logic for `number` will be moved/reused from the existing `port` implementation (generalized). The `boolean` keyword already supports coercion but might need to be exposed as the default `boolean` in the scope.
