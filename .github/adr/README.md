# Architecture Decision Records (ADRs)

This directory contains records of design and architectural decisions made for the ArkEnv project.

## Numbering

ADRs use sequential numbering (e.g., `0001-slug.md`, `0002-slug.md`). When adding a new record, scan for the highest number and increment by one.

## Directory Policy

All ADRs are maintained centrally in this `.github/adr/` directory rather than per-package. This keeps the repository root clean while ensuring project-wide and package-specific architectural context remains in a single, discoverable location.

## When to Write an ADR

An ADR should be written when a decision is:
1. **Hard to reverse**: The cost of changing our mind later is meaningful.
2. **Surprising without context**: A future developer might look at the code and wonder why it was done that way.
3. **The result of a real trade-off**: There were genuine alternatives and we picked one for specific reasons.

## Tooling & Agent Skills

Our AI developer agent leverages these ADRs to guide its development and maintain design consistency. Key skills interacting with these records include:

* [**`grill-with-docs`**](../../skills/grill-with-docs/SKILL.md): Challenges new design/architectural proposals against existing records and glossary terms, dynamically creating or updating ADRs as decisions crystallize.
* [**`improve-codebase-architecture`**](../../skills/improve-codebase-architecture/SKILL.md): Scans the codebase for refactoring or architectural consolidation opportunities, referencing the records in this directory to ensure alignment with existing decisions.
