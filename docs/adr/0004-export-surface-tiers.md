# Three-tier export surface

## Status

Superseded by [ADR 0007: Standard Mode Packaging Strategy](0007-standard-mode-packaging-strategy.md)

## Context

To clean up the ad-hoc package exports and provide an explicitly ArkType-free entry point for Standard Schema users. We reorganize the exports into three distinct tiers:

1. `arkenv` (main): The default, ArkType-dependent entry point exposing `arkenv` and `type`.
2. `arkenv/standard`: A clean, ArkType-free entry point for Standard Schema users.
3. `arkenv/core`: Mode-agnostic types and primitives (like `ArkEnvError` and `ValidationIssue`).

---

**Archived Specs**:

- [2026-02-23-refactor-export-surface](https://github.com/yamcodes/arkenv/tree/openspec-archive/.github/openspec/changes/archive/2026-02-23-refactor-export-surface)
