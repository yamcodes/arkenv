# ADR 0022: Drill-in Sidebar for docs navigation

## Status

Accepted

## Context

ArkEnv docs use Fumadocs `DocsLayout` with the default accordion-style folder sidebar. We want Turborepo-like navigation: opening a root folder replaces the sidebar list (drill-in) instead of expanding inline. Stock Fumadocs does not provide this interaction. Alternatives were (1) CSS-only restyle of accordion folders, (2) custom sidebar components in `@arkenv/fumadocs-ui` wired through `DocsLayout` slots, (3) vendoring Fumadocs layout source. `@arkenv/fumadocs-ui` is a theme/wrapper package, not a Fumadocs fork, so we do not already own upstream sidebar source.

## Decision

We will implement a **Drill-in Sidebar** for the docs site via Fumadocs `DocsLayout` sidebar slots, keeping the Fumadocs page tree as the source of truth. The interactive chrome currently lives in `apps/www` (same module graph as `fumadocs-ui` / `fumadocs-core`) so React context stays shared; extract into `@arkenv/fumadocs-ui` once peer dependency resolution is deduped.

- One drill-in level only: root folders are **Sections**; deeper folders are **Nested Groups** (always-visible header + children, max depth 2), matching Turborepo’s API reference / Guides grouping.
- Every **Section** has an **Overview** index page. Clicking a **Section** navigates to that Overview (and drills); a leaf is always selected on the section **Sidebar Page**. **Leaf** clicks change the URL; Back returns to the root **Sidebar Page** without changing the URL.
- **Sidebar Page** state is otherwise URL-driven on load and route change.
- **Nested Groups** do not collapse (Turbo uses separator-style headers here); **Separators** remain valid for pure labels without a folder.
- Visual language is hybrid: Turborepo structure, active-pill, and horizontal slide transitions; ArkEnv color tokens. Respect `prefers-reduced-motion`.
- Remove the sidebar Install banner. Migrate Guides/Reference `---Label---` **Separators** to nested folders so groupings become **Nested Groups** (or keep Separators where there is no group overview page).
- **Changelog** is an **External Leaf** to GitHub Releases (`https://github.com/yamcodes/arkenv/releases`); drop the in-docs changelog page. Do not add a Glossary external link until a glossary exists.

## Consequences

- Docs nav chrome diverges from stock Fumadocs; upgrades may need adapter work around sidebar slots/APIs.
- Content authors must use nested folders (not separators) for collapsible groups inside a Section, and every Section folder needs an `index` Overview page.
- Users get clearer section focus and Turbo-familiar motion; one-level drill-in means very deep trees stay accordion-within-section rather than stacked sidebar pages.
- Install CTA must live outside the sidebar if we still want it.
