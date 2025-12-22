# Design: Public API Coercion

## Architecture: Pipeline Wrapper Pattern

The secondary `coerce` function will no longer attempt to reach into the `BaseRoot` instances or use `.transform()`. Instead, it will leverage ArkType's public `.pipe()` functionality to create a data transformation layer.

### 1. Introspection via `schema.in.toJsonSchema()`

We use `schema.in` to get a representation of the schema's input *without morphs* and then call `.toJsonSchema()` to get a standard JSON Schema representation for traversal. This ensures compatibility with schemas that use `.pipe()` or other morphs, which would otherwise cause `toJsonSchema()` to throw.

**Key identification rules (mapped from current `isNumeric`/`isBoolean`):**
- **Numeric**: `domain: "number"`, or `kind: "unit"` with a number value, or an `intersection` with a numeric basis.
- **Boolean**: `domain: "boolean"`, or `kind: "unit"` with a boolean value.
- **Unions**: Recursively check `branches`.

### 2. Path Mapping

We will build a `CoercionMap` which is a record of paths (dot-notated or array) indicating where coercion should be applied.

Example:
```ts
const schema = type({ PORT: "number", DEBUG: "boolean?" })
// Map: { "PORT": ["number"], "DEBUG": ["boolean"] }
```

### 3. Execution Flow

The `coerce` function returns:
```ts
type("unknown")
  .pipe(data => {
    // 1. Iterate CoercionMap
    // 2. data[path] = maybeParsedNumber(data[path]) constant-time-ish update
    // 3. return coercedData
  })
  .pipe(schema)
```

## Trade-offs and Considerations

### Why `toJsonSchema()` over `in.json`?
1. **Standardization**: `toJsonSchema()` returns a Draft 2020-12 compliant structure, making the introspection logic decoupled from ArkType's internal `JsonStructure`.
2. **Type Safety**: The `JsonSchema` type provided by ArkType is exhaustive and strictly typed, whereas `in.json` returns a loose object.

### Why `.in.toJsonSchema()`?
ArkType's `toJsonSchema()` implementation throws a `ToJsonSchemaError` if the schema contains morphs. By accessing `.in` first, we resolve the input side of the root node (which is always morph-free) and generate a schema representing what the environment variables must look like before transformations.

### Performance
Introspection is performed once per `coerce()` call. Since `createEnv` usually runs once at startup, this is negligible. The resulting morph is a simple iteration over known paths.

### Handling Unions
The strategy preserves "loose" coercion for mixed-type unions (e.g. `number | string`). If it *could* be a number, we try to parse it. If parsing fails, we leave it alone, and the subsequent `.pipe(schema)` handles the validation.
