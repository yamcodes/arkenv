# ArkType Internal API Usage

This document tracks the usage of undocumented or "stable-ish" ArkType internal APIs within `arkenv`.
These APIs are primarily accessed via `.internal` and are subject to change, though they are currently validated against ArkType `^2.1.22`.

## API Registry

### Methods & Entry Points

| API            | Usage                                               | Status                                   |
| :------------- | :-------------------------------------------------- | :--------------------------------------- |
| `.internal`    | Gateway to the underlying ArkNode structure.        | **Stable-ish** (Documented as gateway)   |
| `.transform()` | Deeply traverses and rewrites the schema structure. | **Internal** (Used for magic coercion)   |
| `.pipe()`      | Manually applied to internal nodes to chain morphs. | **Internal**                             |
| `.select()`    | Filters nodes based on kind/criteria.               | **Alpha** (Documented, not fully stable) |

### Node Properties (Introspection)

These properties are used to identify where coercion should be applied. Most are documented in ArkType's [Introspection docs](https://arktype.io/docs/introspection).

| Property      | Node Kind      | Purpose                                                 |
| :------------ | :------------- | :------------------------------------------------------ |
| `.kind`       | All            | Discriminates the type of node (e.g., `union`, `unit`). |
| `.domain`     | `domain`       | Identifies primitive types like `number`.               |
| `.basis`      | `intersection` | Provides the underlying type of a refined node.         |
| `.branches`   | `union`        | Allows recursion into union members.                    |
| `.unit`       | `unit`         | Accesses the exact value of a literal (e.g., `1`).      |
| `.expression` | Various        | Fallback representation used for some booleans.         |

### Transform Context

The `.transform((kind, inner) => ...)` mapper relies on:

- **`kind`**: Determining if we are at a `required` or `optional` property.
- **`inner.value`**: The actual schema node for that property, which we replace with a coerced version.

## Risk Mitigation

- **Logic Isolation**: All internal access is abstracted through helpers in `coerce.ts`.
- **Contract Tests**: `arktype-contract.test.ts` validates these properties exist at test-time.
- **Compatibility CI**: A daily workflow tests against `latest` and `nightly` ArkType versions.
