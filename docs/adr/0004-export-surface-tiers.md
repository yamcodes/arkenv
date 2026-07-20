# ADR 0004: Three-tier export surface

## Status

Superseded by [ADR 0007: Standard Mode Packaging Strategy](0007-standard-mode-packaging-strategy.md)

## Summary

Historical decision to organize package exports into three tiers (`arkenv`, `arkenv/standard`, and `arkenv/core`) so Standard Schema users had an explicitly ArkType-free entry point.

On `v1`, that packaging model was replaced by the asymmetric strategy in ADR 0007: separate `@arkenv/core` / `@arkenv/standard` packages, with framework plugins exposing both engines via subpath exports rather than a three-tier surface on a single package.

Read [ADR 0007](0007-standard-mode-packaging-strategy.md) for the current decision.

---

**Archived Specs**:

- [2026-02-23-refactor-export-surface](https://github.com/yamcodes/arkenv/tree/openspec-archive/.github/openspec/changes/archive/2026-02-23-refactor-export-surface)
