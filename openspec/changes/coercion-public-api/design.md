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
... (rest of section) ...

### 3. Execution Flow
... (rest of section) ...

## Trade-offs and Considerations

### Why `toJsonSchema()` with Fallback?
1. **Standardization**: `toJsonSchema()` returns a Draft 2020-12 compliant structure, making the introspection logic decoupled from ArkType's internal `JsonStructure`.
2. **Robustness**: Types like `string.url` or custom `.narrow()` calls would normally cause `toJsonSchema()` to fail globally. The `fallback: (ctx) => ctx.base` mechanism allows the generator to "skip" individual unjsonifiable constraints while preserving the rest of the schema structure.
3. **API Stability**: This approach avoids any reliance on internal properties like `.internal` or `.json` structure, using only the documented `toJsonSchema` options.

### Handling Unions
The strategy preserves "loose" coercion for mixed-type unions (e.g. `number | string`). If it *could* be a number, we try to parse it. If parsing fails, we leave it alone, and the subsequent `.pipe(schema)` handles the validation.
