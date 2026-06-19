# Coercion via pre-coercion execution model

To support environment variable coercion (e.g., parsing strings to numbers/booleans at runtime) without breaking ArkType's refinement syntax or mutating the input environment object.

Initially, ArkType's coercion was implemented by wrapping the compiled schema in a `.pipe()` pipeline inside ArkType's type system. However, this required an unsafe `as BaseType<t, $>` cast, mutated the input environment object in-place, and differed from the execution model of standard schema validators.

To unify the architecture (as described in [#1178](https://github.com/yamcodes/arkenv/issues/1178)), both the `arkenv` and `arkenv/standard` entry points now share a unified pre-coercion model:

1. **Introspect Schema**: Extracts the JSON Schema (using `.in.toJsonSchema` for ArkType, or standard metadata for other validators).
2. **Compute Coercion Paths**: Traverses the JSON Schema to identify which paths (like numbers, booleans, arrays, or objects) require type conversion.
3. **Pre-coerce Input**: Creates a shallow copy of the input environment object, and applies targeted coercion in-place on the copy.
4. **Validate**: Passes the pre-coerced copy to the original, unmodified schema for validation.

This unified model simplifies the codebase, avoids unsafe type casting, avoids mutating the original environment object, and ensures consistent coercion behavior.

---

**Archived Specs**:

- [2025-12-20-add-coercion](https://github.com/yamcodes/arkenv/tree/openspec-archive/.github/openspec/changes/archive/2025-12-20-add-coercion)
- [2025-12-22-coercion-public-api](https://github.com/yamcodes/arkenv/tree/openspec-archive/.github/openspec/changes/archive/2025-12-22-coercion-public-api)
