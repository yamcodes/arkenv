## Context

The www app configures its header entirely through fumadocs-ui's `BaseLayoutProps` passed to `HomeLayout` and `DocsLayout`. All nav configuration lives in `apps/www/app/layout.config.tsx`. Fumadocs-ui's built-in navbar renders a basic navigation bar — functional but not styled to the ArkEnv design system and not reusable outside the www app.

The vite.dev header (powered by VitePress + `@voidzero-dev/vitepress-theme`) serves as the visual reference: a fixed header with a backdrop blur on scroll, logo on the left, navigation links in the center, and icon actions (GitHub, theme toggle) on the right.

Fumadocs-ui supports replacing the navbar entirely via `nav: { component: <CustomNav /> }` in `BaseLayoutProps`. This is the integration point we use.

## Goals / Non-Goals

**Goals:**
- Create a `Header` React component in `packages/fumadocs-ui/src/components/header.tsx`
- Export it from `@arkenv/fumadocs-ui/components`
- Style it to match the vite.dev aesthetic: fixed position, transparent → blurred-background on scroll, logo left, links center, actions right
- Wire it into the www app's `HomeLayout` and `DocsLayout` via `nav: { component: <Header /> }`

**Non-Goals:**
- Replacing or wrapping `HomeLayout` / `DocsLayout` entirely — only the navbar slot is replaced
- Adding mega-menus, dropdowns, or mobile drawer (those can be added incrementally)
- Any changes to fumadocs-ui's CSS design tokens or existing components

## Decisions

### Decision: Use `nav.component` slot rather than forking fumadocs-ui layouts

Fumadocs-ui exposes `nav: { component: ReactNode }` on both `HomeLayout` and `DocsLayout`. Passing a custom component there replaces the built-in navbar while keeping sidebar, search, and other layout machinery intact.

**Alternatives considered:**
- Fork / wrap the layout components — too much surface area; breaks on upstream updates
- Use CSS overrides to restyle the existing navbar — fragile, can't change markup structure

### Decision: Implement scroll-aware transparency in the Header itself

The Header component tracks `scrollY` via a `useEffect` listener and applies a CSS class (e.g. `scrolled`) when the page has scrolled past a threshold. This drives the `backdrop-blur` and background transition.

**Alternatives considered:**
- Use the fumadocs-ui `transparentMode: 'top'` option — only works with the built-in navbar, not a custom component

### Decision: Props-driven nav links, not hardcoded

The `Header` component accepts `links` (array of `{ text, url }`) and `actions` (icon buttons) as props so the www app can configure its own nav without forking the component. A `logo` prop (ReactNode) lets the app pass its own logo.

**Alternatives considered:**
- Hardcode ArkEnv-specific links inside the component — makes the component non-reusable

### Decision: Keep `layout.config.tsx` but simplify it

`layout.config.tsx` continues to define shared options. Nav-specific options (links array) move to the Header instantiation in each layout file. The `themeSwitch` config can be removed since the Header owns the theme toggle.

## Risks / Trade-offs

- **Mobile nav not included in scope** → The built-in fumadocs mobile menu is replaced along with the desktop nav. We must ensure a minimal mobile fallback (hamburger menu or reuse fumadocs-ui's mobile drawer) is included to avoid breaking mobile UX.
  - Mitigation: Keep the fumadocs-ui mobile nav by using the `nav.children` slot or render a simple mobile menu within the Header component.

- **Upstream fumadocs-ui nav API changes** → If fumadocs-ui changes how `nav.component` works, we'd need to update the wiring.
  - Mitigation: Low probability at this version (16.4.7). The slot has been stable across recent versions.

## Migration Plan

1. Build and export `Header` from `@arkenv/fumadocs-ui`
2. Update `apps/www/app/(home)/layout.tsx` to pass `Header` to `HomeLayout`
3. Update `apps/www/app/docs/layout.tsx` to pass `Header` to `DocsLayout`
4. Remove superseded nav options from `layout.config.tsx`
5. Visual QA: compare against vite.dev header on desktop and mobile
