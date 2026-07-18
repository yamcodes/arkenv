# Architecture decision records (ADRs)

This directory contains records of design and architectural decisions made for the ArkEnv project.

## Numbering

ADRs use zero-padded sequential filenames (e.g. `0001-slug.md`, `0002-slug.md`).

**Rules:**

1. **Immutable numbers.** Once an ADR is merged, its number is never reused or renumbered. Filename changes that alter the number are reserved for fixing accidental collisions before (or immediately after) merge.
2. **Next number = max + 1.** When adding a record, scan this directory for the highest existing number on **this branch** and increment by one. Do not fill gaps.
3. **Gaps are fine.** Dual-tracking (`dev` / `v1`) means some numbers exist only on one line. A jump such as `0006` → `0009` on `dev` is expected when `0007`/`0008` live on `v1` only.
4. **Numbers are branch-local.** The same slug may carry different numbers on `dev` vs `v1`. Do not try to unify numbering across branches without a deliberate, repository-wide renumber — high cost, low value. Prefer slug-based links, and always open the file on the branch you are working on.

## Directory policy

All ADRs are maintained centrally in this `docs/adr/` directory rather than per-package. This keeps the repository root clean while ensuring project-wide and package-specific architectural context remains in a single, discoverable location.

Package and user-facing READMEs stay consumer-oriented; this directory is contributor territory for architectural rationale.

## When to write an ADR

An ADR should be written when a decision is:

1. **Hard to reverse**: The cost of changing our mind later is meaningful.
2. **Surprising without context**: A future developer might look at the code and wonder why it was done that way.
3. **The result of a real trade-off**: There were genuine alternatives and we picked one for specific reasons.

## Related clusters

These groups share a theme. They remain separate ADRs (no nesting or history rewrites) — use the links when reviewing related decisions. Numbers differ by branch; prefer slugs.

| Cluster                            | Slugs                                                                                                                                                                                               |
| :--------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework server/client boundaries | `nextjs-runtime-env`, `nextjs-conditional-exports-boundary`, `nuxt-vite-compile-time-boundary`, `flat-layout-codegen-type-strategy`, `framework-subpath-exports`, `strict-layout-complexity-budget` |
| Packaging & module graph           | `export-surface-tiers`, `standard-mode-packaging-strategy`, `bundle-isolation-over-dryness`, `runtime-shared-logic-strategy`, `shared-build-package`                                                |
| CLI / scaffold IR                  | `cli-hosting-preset-field-metadata`, `dotenv-linter-custom-parser-strategy`                                                                                                                         |

## Tooling & agent skills

Our AI developer agent leverages these ADRs to guide its development and maintain design consistency. Key skills interacting with these records include:

- [**`grill-with-docs`**](../../skills/grill-with-docs/SKILL.md): Challenges new design/architectural proposals against existing records and glossary terms, dynamically creating or updating ADRs as decisions crystallize.
- [**`improve-codebase-architecture`**](../../skills/improve-codebase-architecture/SKILL.md): Scans the codebase for refactoring or architectural consolidation opportunities, referencing the records in this directory to ensure alignment with existing decisions.
