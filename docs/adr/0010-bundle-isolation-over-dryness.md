# ADR 0010: Bundle Isolation trumps DRYness

## Status

Superseded by [ADR 0011: Runtime Shared Logic Strategy](0011-runtime-shared-logic-strategy.md)

## Summary

Historical decision that **bundle isolation strictly trumps DRYness** across the ArkType (`@arkenv/core`) and Standard Schema (`@arkenv/standard`) engine boundary. Shared source modules that bridge those entry points risk pulling ArkType into Standard Schema user bundles.

The isolation principle remains in force. The original mechanic (intentional duplication of parse/format/issue-mapping logic) was refined by ADR 0011: shared stateless helpers live in internal `@repo/*` packages and are **build-time inlined** into each published engine, so isolation is preserved without hand-maintained duplicates.

Read [ADR 0011](0011-runtime-shared-logic-strategy.md) for the current decision (including the folded isolation principle).
