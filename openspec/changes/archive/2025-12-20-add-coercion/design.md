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
const isNumeric = (node: any): boolean =>
    node.domain === "number" ||
    (node.hasKind?.("intersection") && node.basis?.domain === "number") ||
    (node.hasKind?.("union") && node.branches.some(isNumeric)) ||
    (node.kind === "unit" && typeof node.unit === "number");

const isBoolean = (node: any): boolean =>
    node.domain === "boolean" ||
    node.expression === "boolean" ||
    (node.hasKind?.("union") && node.branches.some(isBoolean)) ||
    (node.kind === "unit" && typeof node.unit === "boolean");

export function coerce(schema: any): any {
    return schema.transform((kind, inner) => {
        if (kind === "required" || kind === "optional") {
            const value = inner.value;
            if (isNumeric(value)) return { ...inner, value: maybeParsedNumber.pipe(value) };
            if (isBoolean(value)) return { ...inner, value: maybeParsedBoolean.pipe(value) };
        }
        return inner;
    });
}
```

### `@repo/keywords`
Provides the `maybeParsedNumber` and `maybeParsedBoolean` types used as the targets for the transformer's `pipe` operations. These "loose" morphs ensure that if a string cannot be parsed as a number/boolean, it returns the original string, allowing other branches of a union (like `string`) to match.

## Edge Cases and Scope Limitations

### Nested Objects
The `schema.transform()` method recursively traverses the schema. Since the transformer identifies and modifies `required` and `optional` property nodes, nested object structures are automatically handled as the walker reaches the leaf property definitions.

### Union Types
The `isNumeric` and `isBoolean` helpers recursively check union branches. If any branch matches the target domain (or is an intersection/unit thereof), the entire property is wrapped in a coercion pipe. 
- **Selective Coercion**: We use "loose" morphs (`maybeParsedNumber`) so that if the environment variable is `"hello"` and the type is `number | "hello"`, the morph returns `"hello"`, which then correctly matches the literal branch.

### Array Types
In the current implementation, coercion applies to **object properties** but does not automatically walk into **array elements** (sequences) unless they are defined as properties within an object. Root-level sequences or elements of a `number[]` are currently out of scope for automatic string-to-number coercion unless the environment variable is pre-processed into an array.

### Conditional/Discriminated Types
Discriminated unions are handled similarly to standard unions. As long as the property node itself can be identified as numeric or boolean (or a union containing them), the coercion will be applied. Narrowing logic within ArkType happens *after* the morph has attempted to produce a numeric value.

### Scope Limitations
- **Internal API Reliance**: This implementation relies on undocumented ArkType internal structures.
- **Literal Strictness**: Per requirements, numeric literals like `1 | 2` are specifically identified via unit checks to ensure they are coerced from `"1"`, aligned with standard environment variable behavior where all inputs start as strings.
- **Whitespace**: Empty strings or whitespace are currently NOT coerced to `0` for numbers; they are preserved as strings, which will typically fail numeric validation as intended.
