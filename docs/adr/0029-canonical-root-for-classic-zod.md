# ADR 0029: Canonical root import for Classic Zod

Classic Zod 4.2+ embeds Standard JSON Schema on the schema value, so the only Classic Zod entry point is root `@arkenv/standard`. We will not publish `@arkenv/standard/zod` as a re-export of that root.

## Status

Accepted ([#1609](https://github.com/yamcodes/arkenv/issues/1609))

## Context

ADR 0025's 2026-08-24 amendment added `@arkenv/standard/valibot` and `@arkenv/standard/zod-mini` because those libraries keep JSON Schema conversion in a standalone function. Classic Zod does not need that binder. The amendment deferred a cosmetic `/zod` alias "for DX symmetry."

## Decision

**Option A (canonical root).** Reject `@arkenv/standard/zod`.

- A `/zod` subpath would imply a Zod-specific adapter. The Standard Schema engine's value is validator-agnostic consumption of anything that implements the spec.
- ADR 0019 already removed redundant re-exports (`./shared`) that duplicated a capability without adding semantics. A `/zod` alias is the same class of surface bloat.
- Shipping `/zod` would invite `/yup`, `/typebox`, `/arktype`, and every later Standard Schema library, turning a zero-config root into a maintenance list.
- `/valibot` and `/zod-mini` stay. They are not aliases: they bind a converter. Do not flatten Valibot onto the root import in docs or `arkenv init` to "prove" symmetry.

Discoverability is a documentation problem. The Zod guide, `@arkenv/standard` reference, Choosing an engine, and the `arkenv init` Zod dialect already import from the root.

## Considered options

- **A — Canonical root (chosen).** Classic Zod uses `@arkenv/standard`. Converter subpaths remain only where JSON Schema is not on the value.
- **B — Validator aliases.** Add `@arkenv/standard/zod` (and maybe more) as thin re-exports. Rejected: fake specialized tooling, ADR 0019 regression, unbounded subpath checklist.
