# ArkType Internal API Usage

This document tracks the usage of undocumented or "stable-ish" ArkType internal APIs within `arkenv`.

**UPDATE: As of the Public API Refactor, `arkenv` no longer uses `.internal`, `.transform()`, or direct internal node properties for coercion.**

## Current Status

We have migrated to the **Pipeline Wrapper Pattern**. Instead of reaching into the schema's internals, we use public APIs:

1.  **`.in.json`**: For stable, serializable introspection of input requirements.
2.  **`.pipe()`**: For data transformation using standard ArkType pipelines.

## Historical Context (Removed APIs)

The following were previously used by `coerce.ts` and have been removed to improve stability:

- `.internal.transform()`: Replaced by data-preprocessing via `.pipe()`.
- `.internal.pipe()`: Replaced by public `.pipe()`.
- Internal properties (`.domain`, `.branches`, `.unit`, `.basis`): Replaced by traversing the public JSON representation.

## Remaining Internal Usage

| API            | Usage                                               | Status                |
| :------------- | :-------------------------------------------------- | :-------------------- |
| `$.type.raw()` | Used in `create-env.ts` to convert object literals. | **Stable / Standard** |

## Risk Mitigation

- **No Internal Access**: All coercion logic is now implemented using public ArkType features.
- **Serialization Contract**: We depend on the structure of ArkType's JSON representation (`.json`), which is a public interface maintained for serializability.
- **Test Coverage**: Existing integration tests continue to verify that coercion behavior remains consistent across ArkType updates.
