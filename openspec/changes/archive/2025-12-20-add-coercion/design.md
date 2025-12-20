# Design: Coercion

## Architecture

Coercion is implemented via a post-parsing transformation of the ArkType schema.

### Flow
1.  **Scope Definition**: `@repo/scope` defines `number` and `boolean` as standard ArkType keywords. This allows the string parser to handle refinements like `0 < number < 100` normally.
2.  **Schema Compilation**: `createEnv` parses the user's schema definition against the scope.
3.  **Global Transformation**: `createEnv` calls a `coerce` utility which uses `schema.transform()` to walk the nodes.
    - If a node is numeric (a `number` domain or an intersection with a `number` basis), it is piped into `parsedNumber`.
    - If a node is boolean, it is piped into `parsedBoolean`.
4.  **Validation**: The resulting transformed schema is used to validate the environment. Since the leaf nodes are now morphs, they automatically coerce strings to their target types before validating constraints.

## Decisions

### Decision: Prefer Transformation over Scope Overrides
We initially attempted to override `number` and `boolean` directly in the scope with morphs. We rejected this because it broke ArkType's ability to apply numeric constraints (ranges, divisors) to those types.

**Rationale:**
*   **Feature Completeness**: Supports ranges (`number >= 18`), divisors (`number % 2`), and unions seamlessly.
*   **Parser Compatibility**: Keeps the scope primitives "clean," avoiding `ParseError` during schema definition.
*   **Centralized Logic**: The conversion logic is isolated in a transformer, making it easier to debug and maintain.

### Decision: Relocate Coercion Primitives to Keywords
Conversion morphs like `parsedNumber` and `parsedBoolean` are kept in `@repo/keywords`.

**Rationale:**
*   **Building Blocks**: These can be reused to build other types (like `port`) that need string-to-number parsing.
*   **Modularity**: Keeps the `arkenv` transformer decoupled from the specific implementation of the conversion logic.

## Implementation Details

### `coerce` Utility (`packages/arkenv/src/utils/coerce.ts`)
The transformer identifies property-level values or root-level primitives and wraps them in morphs.

```typescript
export function coerce(schema: any): any {
    return schema.transform((kind, inner) => {
        if (kind === "required" || kind === "optional") {
            const value = inner.value;
            if (isNumeric(value)) return { ...inner, value: parsedNumber.pipe(value) };
            if (isBoolean(value)) return { ...inner, value: parsedBoolean };
        }
        return inner;
    });
}
```

### `@repo/keywords`
Provides the `parsedNumber` and `parsedBoolean` types used as the targets for the transformer's `pipe` operations.
