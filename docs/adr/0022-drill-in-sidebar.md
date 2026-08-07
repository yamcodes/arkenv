# ADR 0022: Drill-in Sidebar for docs navigation

## Status

Accepted

## Context

ArkEnv docs use Fumadocs `DocsLayout` with the default accordion-style folder sidebar. We want Turborepo-like navigation: opening a root folder replaces the sidebar list (drill-in) instead of expanding inline. Stock Fumadocs does not provide this interaction. Alternatives were (1) CSS-only restyle of accordion folders, (2) custom sidebar components in `@arkenv/fumadocs-ui` wired through `DocsLayout` slots, (3) vendoring Fumadocs layout source. `@arkenv/fumadocs-ui` is a theme/wrapper package, not a Fumadocs fork, so we do not already own upstream sidebar source.

Turborepo’s docs distinguish two in-section patterns that look similar but are not the same:

1. **True nesting (n=2)** — e.g. `/docs/guides/ci-vendors/vercel`: a real folder in the tree; sidebar shows a collapsible header with indented children; page taglines use `X > Y`.
2. **Separator grouping** — e.g. `/docs/reference/system-environment-variables`: flat URL under the section; a muted “Configuration” label only groups siblings; tagline stays `X` (section name), never `Configuration > …`.

Conflating those as one “Nested Group” (always-visible, non-collapsible) was wrong.

## Decision

We will implement a **Drill-in Sidebar** for the docs site via Fumadocs `DocsLayout` sidebar slots, keeping the Fumadocs page tree as the source of truth. The interactive chrome currently lives in `apps/www` (same module graph as `fumadocs-ui` / `fumadocs-core`) so React context stays shared; extract into `@arkenv/fumadocs-ui` once peer dependency resolution is deduped.

- One drill-in level only: root folders are **Sections**.
- Inside a **Section**:
  - **Nested Folder** — real child folder (URL depth n=2). Title navigates to the folder overview; a separate chevron toggles indented child **Leaves** (starts expanded; auto-expands when the active path is under the folder). No further nesting (no n=3), no second drill-in.
  - **Separator** — `---Label---` meta entries. Muted non-interactive title; following pages remain flat under the **Section** (URL depth n=1).
- Every **Section** has an **Overview** index page. Clicking a **Section** navigates to that Overview (and drills); a leaf is always selected on the section **Sidebar Page**. **Leaf** clicks change the URL; Back returns to the root **Sidebar Page** without changing the URL.
- **Sidebar Page** state is otherwise URL-driven on load and route change.
- Visual language is hybrid: Turborepo structure, active-pill, and horizontal slide transitions; ArkEnv color tokens. Respect `prefers-reduced-motion`.
- Remove the sidebar Install banner.
- **Changelog** is an **External Leaf** to GitHub Releases (`https://github.com/yamcodes/arkenv/releases`); drop the in-docs changelog page. Do not add a Glossary external link until a glossary exists.

## Consequences

- Docs nav chrome diverges from stock Fumadocs; upgrades may need adapter work around sidebar slots/APIs.
- Content authors must pick deliberately: **Nested Folder** when the URL should nest; **Separator** when grouping flat reference pages. Every **Section** needs an `index` Overview page.
- Users get clearer section focus and Turbo-familiar motion; one-level drill-in plus in-section collapse covers Turbo’s Guides and API reference patterns without a second sidebar page.
- Install CTA must live outside the sidebar if we still want it.
- Page-header taglines (follow-up) must treat Nested Folder paths as `X > Y` and Separator-grouped paths as section-only `X`.
