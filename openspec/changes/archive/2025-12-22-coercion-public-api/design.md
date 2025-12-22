# Design: Public API Coercion

## User-Facing Behavior

The coercion system works seamlessly with the standard `createEnv` API. When enabled (default), string inputs in the environment are automatically converted to their target primitive types before validation.

```ts
// User creates an env schema and passes the environment (e.g. process.env)
const env = createEnv(
  type({
    PORT: "number",
    DEBUG: "boolean"
  }),
  {
    env: process.env, // e.g. { PORT: "3000", DEBUG: "true" }
    coerce: true      // Enabled by default
  }
);

// Result is fully typed and coerced:
// env.PORT  -> 3000 (number)
// env.DEBUG -> true (boolean)
```

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
4.  **Deduplication**: Resulting paths are stringified (e.g., `["PORT"]` becomes `"[\"PORT\"]"`) and stored in a `Set` to ensure uniqueness.
    *   **Collision Handling**: Stringification is robust for standard JSON keys.
    *   **Union Overlaps**: If a union has multiple branches pointing to the same key (e.g., `number | boolean`), the path is added once. Both coercion strategies (number then boolean) are applied to that single path during execution.
    *   **Discriminated Unions**: Traversed recursively via `oneOf`/`anyOf`. If branches share keys (e.g. `{ kind: "A", val: "number" } | { kind: "B", val: "boolean" }`), the `val` path is correctly identified. Since coercion is applied loosely (try parse number, then try parse boolean), mixed targets at the same path are handled safely.

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
    *   **Handling Missing/Null Keys**: If a key is missing or `null` along the path, traversal aborts for that target. `undefined` values are treated as missing.
    *   **Handling Arrays**: When encountering the `*` marker, we iterate *all* elements of the current array.
    *   **Mutation**: Inputs are mutated **in-place**.
        *   **Rationale**: Performance and simplicity. Typical environment objects (like `process.env`) are flat and effectively disposable in this context. Cloning deep objects for every validation would introduce unnecessary overhead.
    *   **Coercion Logic**: When a leaf node is reached, we apply a sequential "best-effort" coercion:
        1.  Attempt `maybeParsedNumber`: converts "123" -> 123.
        2.  If result is still a string (e.g. "true"), attempt `maybeParsedBoolean`: converts "true" -> true.
        *   **Unconvertible Values**: Values that fail both checks (e.g. "abc") are left **as-is**. This is intentional; let the subsequent validation phase report the specific type error (e.g. "expected number, got string 'abc'").

3.  **Validation (Final Phase)**:
    *   The potentially mutated `data` is passed to the original `schema`.
    *   ArkType performs full validation.
    *   **Pipeline Syntax**: This is constructed via `type("unknown").pipe(transform).pipe(schema)`.
        *   `type("unknown")`: Accepts any input.
        *   `.pipe(transform)`: Runs our coercion logic (in-place mutation).
        *   `.pipe(schema)`: Passes the coerced result to the user's strict schema for final validation.

## Trade-offs and Considerations

### Why `toJsonSchema()` with Fallback?
1. **Standardization**: `toJsonSchema()` returns a Draft 2020-12 compliant structure, making the introspection logic decoupled from ArkType's internal `JsonStructure`.
2. **Robustness**: Types like `string.url` or custom `.narrow()` calls would normally cause `toJsonSchema()` to fail globally. The `fallback: (ctx) => ctx.base` mechanism allows the generator to "skip" individual unjsonifiable constraints while preserving the rest of the schema structure.
3. **API Stability**: This approach avoids any reliance on internal properties like `.internal` or `.json` structure, using only the documented `toJsonSchema` options.

### Handling Unions
The strategy preserves "loose" coercion for mixed-type unions (e.g. `number | string`). If it *could* be a number, we try to parse it. If parsing fails, we leave it alone, and the subsequent `.pipe(schema)` handles the validation.

### Performance and Mutation
*   **Setup vs Runtime**: Introspection (`findCoercionPaths`) occurs once at setup time. The cost is amortized over all subsequent validations. If no coercion targets are found, the runtime overhead is effectively zero (direct pass-through).
*   **In-Place Mutation**: We chose in-place mutation over cloning for performance. Environment objects are typically transient and used solely for configuration loading. Cloning large nested config objects recursively would be prohibitively expensive for this use case. Use cases requiring immutable inputs should clone data *before* passing it to `arkenv`.

### Coercion Limitations
*   **Custom Predicates**: Because we rely on the implementation-agnostic `toJsonSchema` output, custom predicates (e.g., `number.refine(n => isPrime(n))`) are not visible to the introspection layer. We only see "number". This is acceptable because we simply coerce to the primitive type; the predicate is still applied during the final validation step.
*   **Loose Coercion**: We do not implement "strict" coercion (e.g. failing if a string should be a number but isn't). We leave invalid strings as strings. This simplifies the coercion logic and delegates error reporting to ArkType's robust validation engine.

### Alternatives Considered
*   **Recursive `.transform()`**: We initially considered attaching `.transform()` to every leaf node. This proved fragile as it required accessing internal APIs (`.internal`, `branches`) that may change between ArkType versions.
*   **Global Schema Rewrite**: Deeply cloning and rewriting the schema definition to inject coercion nodes was deemed too complex and risky for maintenance.
*   **Selected Approach**: The current "Introspection + Pipeline" approach offers the best balance of stability (public APIs only), performance (one-time setup), and maintainability (decoupled logic).
