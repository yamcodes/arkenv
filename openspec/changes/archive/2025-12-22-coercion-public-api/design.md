# Design: Public API Coercion

## Architecture: Pipeline Wrapper Pattern

The secondary `coerce` function will no longer attempt to reach into the `BaseRoot` instances or use `.transform()`. Instead, it will leverage ArkType's public `.pipe()` functionality to create a data transformation layer.

### 1. Introspection via `schema.in.toJsonSchema()` with Fallback

We use `schema.in` to get a representation of the schema's input *without morphs*. To ensure 100% stability even when encountering types that are not representable in JSON Schema (like those with customized predicates or narrows), we call `.toJsonSchema()` with a base-preserving fallback:

```ts
const json = schema.in.toJsonSchema({
    fallback: (ctx) => ctx.base
})
```

This strategy ensures:
- **Resilience**: The introspection never throws due to unjsonifiable refinements (e.g., `string.url`).
- **Granularity**: We "work for what we can". If a property is a `number` with a custom narrowing predicate, we can still identify it as a `number` via its base and apply coercion, while skipping the predicate during path discovery.
- **Standards Compliance**: We exclusively use public ArkType APIs.

**Key identification rules (mapped from JSON Schema paths):**
- **Numeric**: `type: "number"`, or `type: "integer"`, or `const`/`enum` with numeric values.
- **Boolean**: `type: "boolean"`, or `const`/`enum` with boolean values.
- **Objects/Arrays**: Recursively traversed via `properties` and `items`.
- **Unions**: Handled via `anyOf`, `oneOf`, or `allOf`.

### 2. Path Mapping

We traverse the generated JSON Schema to identify all possible paths that terminate in a type requiring coercion (specifically `number`, `integer`, or `boolean`).

**Mapping Rules:**
1.  **Primitives**:
    *   `type: "number"` or `type: "integer"` -> Mark path for numeric coercion.
    *   `type: "boolean"` -> Mark path for boolean coercion.
    *   `const` or `enum`: If the value(s) are numbers or booleans -> Mark path.
2.  **Recursion**:
    *   `properties`: Traverse into keys (e.g., `path: ["nested", "key"]`).
    *   `items` (Arrays): 
        *   If `items` is an array (tuples), traverse by index.
        *   If `items` is a schema (lists), traverse with strict marker `*` (e.g., `path: ["list", "*"]`).
3.  **Unions**: Recursively traverse all choices in `anyOf`, `oneOf`, and `allOf`.
4.  **Deduplication**: Resulting paths are stringified and deduplicated to avoid redundant processing.

**Example Path Map:**
For a schema `{ PORT: "number", FLAGS: "boolean[]" }`, the inspection yields:
```ts
[
  { path: ["PORT"] },       // Numeric target
  { path: ["FLAGS", "*"] }  // Boolean target for all array elements
]
```

### 3. Execution Flow

The implementation wraps the original validation in a predictable 3-step pipeline:

1.  **Introspection (Setup Phase)**:
    *   Call `schema.in.toJsonSchema()` with fallback.
    *   Run `findCoercionPaths()` to generate a `CoercionTarget[]` list.
    *   If no targets are found, return the original schema immediately (zero runtime overhead).

2.  **Pre-processing (Runtime Phase)**: 
    *   If targets exist, wrapped schema executes `applyCoercion(data, targets)`.
    *   **Traversal**: For each target path, we safely walk the input object.
    *   **Handling Missing Keys**: If a key along the path is missing, traversal aborts early for that target (no error thrown).
    *   **Handling Arrays**: When encountering the `*` marker, we iterate *all* elements of the current array.
    *   **Mutation**: When a leaf node is reached, inputs are mutated *in place*:
        *   Attempt `maybeParsedNumber`: parses strings like `"123"` to `123`.
        *   If that fails (returns string), attempt `maybeParsedBoolean`: parses `"true"`/`"false"` to boolean.
        *   Values that cannot be coerced (e.g. `"abc"` for a number field) are left as-is.

3.  **Validation (Final Phase)**:
    *   The potentially mutated `data` is passed to the original `schema`.
    *   ArkType performs full validation. If a value wasn't coerced (e.g. `"abc"` remained `"abc"`), ArkType returns a standard validation error (e.g. "must be a number").
    *   This pipeline is constructed via `type("unknown").pipe(transform).pipe(schema)`.

## Trade-offs and Considerations

### Why `toJsonSchema()` with Fallback?
1. **Standardization**: `toJsonSchema()` returns a Draft 2020-12 compliant structure, making the introspection logic decoupled from ArkType's internal `JsonStructure`.
2. **Robustness**: Types like `string.url` or custom `.narrow()` calls would normally cause `toJsonSchema()` to fail globally. The `fallback: (ctx) => ctx.base` mechanism allows the generator to "skip" individual unjsonifiable constraints while preserving the rest of the schema structure.
3. **API Stability**: This approach avoids any reliance on internal properties like `.internal` or `.json` structure, using only the documented `toJsonSchema` options.

### Handling Unions
The strategy preserves "loose" coercion for mixed-type unions (e.g. `number | string`). If it *could* be a number, we try to parse it. If parsing fails, we leave it alone, and the subsequent `.pipe(schema)` handles the validation.
