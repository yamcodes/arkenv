# ADR 0000: Use architecture decision records (ADRs)

## Status

Accepted

## Context

Previously, the project used the active Spec-Driven Development workflow (OpenSpec) with custom tooling, commands, workflows, and platform-specific configurations. While this provided detailed specifications, maintaining custom developer-facing platform scripts and agent-specific workspace tools added significant overhead and increased repository complexity.

We wanted a lightweight, standard way to capture durable, trade-off-driven architectural decisions that:

1. Keeps the codebase and development workflow simple.
2. Lowers maintenance overhead (no custom orchestration scripts or platform-specific configs).
3. Preserves historical context for future developers.

## Decision

We decided to:

1. Decommission all active OpenSpec tooling (workflows, platform-specific commands, and custom agent skills).
2. Archive the `.github/openspec/` directory under the git tag [`openspec-archive`](https://github.com/yamcodes/arkenv/tree/openspec-archive/.github/openspec) as a historical reference.
3. Adopt Architecture Decision Records (ADRs) as the source of truth for architectural decisions, located centrally in `docs/adr/`.
4. Prefix ADRs sequentially, beginning with `0000` to document this migration and the ADR process itself.

## Consequences

- **Lower overhead**: No custom CLI commands or agent skills to maintain.
- **Traceability**: Future developers can read ADRs to understand why key structures (like Bun configurations or the export surface) exist, with direct links to the historical OpenSpec changes for full design details.
- **Simplicity**: ADRs are written as plain, standard markdown files that do not require any specialized workflow engine.
