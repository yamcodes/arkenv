# Design: Public API Coercion

## Architecture: Pipeline Wrapper Pattern

The secondary `coerce` function will no longer attempt to reach into the `BaseRoot` instances or use `.transform()`. Instead, it will leverage ArkType's public `.pipe()` functionality to create a data transformation layer.

### 1. Introspection via `schema.in.json`

We use `schema.in` to get a representation of the schema's input *without morphs*. We then access `.json` to get a serializable structure.

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

### Why `in.json` over `toJsonSchema()`?
1. **Fidelity**: `in.json` is a 1:1 representation of ArkType's internal state but in a public, serializable format. `toJsonSchema` is lossy and handles things like `bigint` or customs constraints via fallbacks.
2. **Complexity**: `toJsonSchema` introduces `$ref` and `$defs`, which would require a complex resolver to traverse. `in.json` keeps references local to the object or uses stable aliases.

### Performance
Introspection is performed once per `coerce()` call. Since `createEnv` usually runs once at startup, this is negligible. The resulting morph is a simple iteration over known paths.

### Handling Unions
The strategy preserves "loose" coercion for mixed-type unions (e.g. `number | string`). If it *could* be a number, we try to parse it. If parsing fails, we leave it alone, and the subsequent `.pipe(schema)` handles the validation.
