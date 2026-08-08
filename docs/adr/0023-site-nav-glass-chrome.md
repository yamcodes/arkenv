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

We will unify www navigation as one **Site Nav** (same header everywhere):

- **Glass material** + **Floating bar** (inset, homepage pill radius, **logo top-left**, max width = page column / `--fd-layout-width`) on home, docs, and orphans — not viewport-wide on ultrawide.
- Layout: logo on the left; **Nav core** links centered (Docs · Demo · Roadmap with external icon); theme + GitHub on the right; then a shared **action pill**.
- Home/orphan fills the **action pill** with **Get started**; docs fills it with **Search** — same height, min-width, padding, and capsule radius. No search on home; no Get started on docs.
- Docs mounts a mobile sidebar trigger for tree access without otherwise changing the chrome.
- **Glass densify** on every surface — always glass; denser after scroll. Never solid-at-rest.
- Glass uses sticky + absolutely positioned surface (not `position: fixed`) so `backdrop-filter` can sample page content inside overflow-clipped shells.
- Small screens: hamburger + solid **menu panel** for **Nav core** (and the surface’s action when present).
- **Site Nav** is owned by `apps/www`. Do not publish it as `@arkenv/fumadocs-ui` API. Remove package `Header` in the same change.

## Consequences

- Home ↔ docs no longer swaps chrome families; only the **action pill** contents swap (Get started ↔ Search).
- `@arkenv/fumadocs-ui` loses `Header` — **breaking** for any external consumer of that export (in-repo: www only).
- Docs layout spacing/z-index must account for a floating inset bar; overlay stacking may need retuning.
- Centered links can collide with long left/right clusters at mid breakpoints — watch overlap.
- ADR 0022’s mention of Header as a peer-import example is historical; site chrome is no longer that component.
