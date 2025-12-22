# Proposal: Refactor Coercion to Public API

## Problem

The current coercion implementation in `packages/arkenv/src/utils/coerce.ts` relies on undocumented ArkType internal APIs (`.internal`, `.transform`, `.pipe` on internal nodes). This makes the codebase fragile to ArkType updates and hard to maintain as it requires deep knowledge of ArkType's node architecture.

## Solution

Switch from a **Schema Mutation** approach to a **Data Pre-processing** approach.
Instead of modifying the internal structure of the ArkType schema to accept strings, we will:
1.  Introspect the schema's input requirements using the **public** `schema.in.json` API.
2.  Identify paths that expect `number` or `boolean` types.
3.  Pre-process the input data (environment variables) to coerce values at those paths *before* passing the data to ArkType for final validation.
4.  Wrap the original schema in a pipeline: `type("unknown").pipe(applyCoercion).pipe(schema)`.

## Impact

- **Reliability**: Eliminates dependencies on experimental/internal ArkType APIs.
- **Performance**: Introspection happens once; the pre-processing morph is a simple object traversal.
- **Maintenance**: Uses well-documented ArkType concepts (`domain`, `unit`, `union`) via its public JSON representation.
- **Consistency**: Retains 100% compatibility with existing coercion behavior (loose coercion for mixed-type unions).
