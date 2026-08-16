# ADR 0026: Mobile docs sidebar uses a Sidebar Tree

## Status

Accepted

## Context

[ADR 0022](./0022-drill-in-sidebar.md) shipped a **Drill-in Sidebar** for docs: opening a **Section** replaces the list with that section’s **Sidebar Page**. We wired the same **Drill-in Sidebar** into both the desktop rail and the mobile drawer.

Turborepo / Geistdocs do not. Desktop defaults to drill-in (`sidebarMode="sections"`). The mobile sheet **always** renders the full page tree as expandable nested navigation (`SidebarTree`), and `sidebarMode` is not passed into that sheet. Their docs state this explicitly: on mobile, Geistdocs always uses expandable nested navigation; both desktop modes share the same `meta.json`.

The two surfaces do different jobs:

- **Desktop rail** — persistent ~300px column beside the article. Drill-in is a focus tool: hide sibling **Sections** so the column only shows the current section’s pages. Most clicks stay in-section. Back does not change the URL.
- **Mobile drawer** — transient overlay you open to *leave* the current page. It already closes on navigate. Stacking a second Back (pop a **Sidebar Page**) inside a sheet is nested modality (close vs. up). Switching **Sections** costs Back + tap every time the drawer opens on the URL’s section — the place the reader opened the menu to escape.

Alternatives considered:

1. **Keep drill-in on both** — matches ADR 0022 literally; fights the overlay’s job and Turbo’s split.
2. **Accordion / Sidebar Tree on both** — Geistdocs `sidebarMode="tree"` on desktop. We still want drill-in in the persistent rail (ADR 0022).
3. **Split by surface** (this ADR) — drill-in on desktop; **Sidebar Tree** in the mobile drawer. Same page tree, different interaction.

## Decision

Docs chrome in `@arkenv/fumadocs-ui` follows Geistdocs’ surface split:

- **Desktop** (`min-width: 960px`, ADR 0022 unchanged): **Drill-in Sidebar**. Root **Sections** open a **Sidebar Page**. **Nested Folder** and **Separator** rules inside a section stay as in ADR 0022.
- **Mobile drawer** (`width < 960px`): **Sidebar Tree**. Every **Section** stays on one list and expands in place. The **Section** title navigates to **Overview**; a separate chevron toggles children. No **Sidebar Page**, no Back. **Nested Folder** / **Separator** / **Leaf** semantics inside a **Section** are unchanged. The current **Section** starts expanded; others start collapsed.

Do not add Search inside the drawer (Site Nav already owns Search on docs). Do not change drawer chrome (width, **Site Nav** stacking) in this decision — only the tree interaction.

## Consequences

- Mobile readers see sibling **Sections** without a Back tap; desktop readers keep a quiet in-section rail.
- Two renderers share helpers (`Leaf`, **Nested Folder**, path matching) but must not share **Sidebar Page** state.
- Playwright and visual checks must assert the split (drawer has no “Back to all documentation sections”; desktop still drills).
- Glossary: **Sidebar Tree** is the mobile pattern; “accordion sidebar” is no longer banned for the mobile root list — only for the desktop root↔section transition (see `docs/CONTEXT.md`).
