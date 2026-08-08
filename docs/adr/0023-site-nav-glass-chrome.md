# ADR 0023: Site Nav with shared Glass material

## Status

Accepted

## Context

The www home hero uses a floating liquid-glass **Floating pill** (`HomeNav` / Aurora N5). Docs and 404 use a full-bleed `Header` from `@arkenv/fumadocs-ui` with a solid-at-rest / blur-after-scroll swap. Navigating home → docs feels like the whole chrome is replaced: different geometry, material behavior, link set, and mobile pattern.

Alternatives considered:

1. **Pill everywhere** — use the centered floating pill on docs too. Fights docs reading layout (sidebar trigger, wide chrome, content offset).
2. **Material shared, form adapts** — one **Glass material** and floating family; **Floating pill** on home/orphans, **Docs bar** (inset, rounded, near-full-width) on docs.
3. **Shared-element morph** — animate pill ↔ bar across routes. High complexity; mismatched **surface extras** (Get started, Roadmap, sidebar trigger) morph poorly.
4. **Evolve package `Header`** — put both forms in `@arkenv/fumadocs-ui`. Couples a published kit to one site’s marketing geometry.
5. **www-owned `Site Nav`** — site chrome lives in `apps/www`; remove package `Header` (www was the only consumer under the alpha tag).

Glossary and relationships live in `docs/CONTEXT.md` under **Site chrome (www)**.

## Decision

We will unify www navigation as one **Site Nav**:

- **Glass material** on every surface (hairline, soft shadow, backdrop blur/saturation). Unification is shared material and floating placement, not identical geometry.
- **Floating pill** on home and 404; **Docs bar** on docs (floating wide sibling, not an edge-to-edge sticky header).
- **Glass densify** on the **Docs bar** only — always glass; opacity/blur increase on scroll. Never solid-at-rest. The **Floating pill** stays constant glass.
- **Nav core** on every surface and breakpoint: Why ArkEnv? · Presets · Docs, plus search, theme, GitHub. Small screens expose primary links via hamburger on both forms; the **menu panel** is a solid full-viewport sheet (not glass).
- **Surface extras**: Get started on the pill; sidebar trigger and Roadmap on the docs bar. Docs mobile keeps both sidebar trigger and hamburger (tree vs site nav).
- Cross-route continuity is **static kinship** (instant form swap). No shared-element morph or chrome-only crossfade in the first cut.
- **Site Nav** is owned by `apps/www`. Do not publish it as `@arkenv/fumadocs-ui` API. Remove package `Header` in the same change so a second nav implementation cannot drift.

## Consequences

- Home, docs, and 404 share one chrome model; marketing Aurora and docs reading chrome stay sibling forms, not separate systems.
- `@arkenv/fumadocs-ui` loses `Header` — **breaking** for any external consumer of that export (in-repo: www only). Drill-in sidebar and other kit pieces remain in the package.
- Docs layout spacing/z-index must account for a floating inset bar (not a full-bleed 80px strip); overlay stacking (sidebar drawer, search dialog) may need retuning.
- Home mobile gains a hamburger — slightly busier pill, real **Nav core** parity with docs.
- Future morph/polish remains optional; this ADR deliberately scopes v1 to static kinship.
- ADR 0022’s mention of Header as a peer-import example is historical; site chrome is no longer that component.
