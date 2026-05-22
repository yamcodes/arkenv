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

Fumadocs exposes `transparentMode: 'top'` as a built-in option on the navbar — but this **only applies when using the built-in navbar**. Once `nav.component` is set, fumadocs hands off the entire navbar slot to our component and the `transparentMode` option has no effect. Therefore, the Header component must own its own transparency logic.

The Header tracks `scrollY` via a `useEffect` listener and applies a CSS class (e.g. `scrolled`) when the page has scrolled past a threshold. This drives the `backdrop-blur` and background transition.

**Alternatives considered:**
- Use the fumadocs-ui `transparentMode: 'top'` option with the built-in navbar — would work for transparency but gives no control over markup structure, preventing the vite.dev-style layout

### Decision: `--fd-nav-height` is already set; no extra work needed

When replacing the navbar via `nav.component`, fumadocs still uses the `--fd-nav-height` CSS variable to position layout elements (sidebar, content area) correctly beneath the custom navbar. The existing fumadocs-ui CSS spec already sets `--fd-nav-height: 80px !important`, so no additional wiring is needed here — the Header just needs to be built to that height.

### Decision: Props-driven nav links, not hardcoded

The `Header` component accepts `links` (array of `{ text, url }`) and `actions` (icon buttons) as props so the www app can configure its own nav without forking the component. A `logo` prop (ReactNode) lets the app pass its own logo.

**Alternatives considered:**
- Hardcode ArkEnv-specific links inside the component — makes the component non-reusable

### Decision: Delete `layout.config.tsx`

Once all nav-specific options (logo, links, actions/theme toggle) moved into the Header instantiation inside each layout file, `layout.config.tsx` became an empty shell with no remaining consumers. Rather than keeping a meaningless file, it was deleted. Each layout file now directly instantiates `Header` with its own props.

## Risks / Trade-offs

- **Mobile nav not included in scope** → The built-in fumadocs mobile menu is replaced along with the desktop nav. A full mobile drawer/hamburger is deferred to a future iteration.
  - Mitigation chosen: Nav links are hidden on mobile via responsive CSS (`hidden md:flex`). The logo and actions remain visible on all screen sizes. No `nav.children` wiring or custom mobile drawer is included in this change — mobile navigation is a known gap and should be addressed in a follow-up.

- **Upstream fumadocs-ui nav API changes** → If fumadocs-ui changes how `nav.component` works, we'd need to update the wiring.
  - Mitigation: Low probability at this version (16.4.7). The slot has been stable across recent versions.

## Migration Plan

1. Build and export `Header` from `@arkenv/fumadocs-ui`
2. Update `apps/www/app/(home)/layout.tsx` to pass `Header` to `HomeLayout`
3. Update `apps/www/app/docs/layout.tsx` to pass `Header` to `DocsLayout`
4. Remove superseded nav options from `layout.config.tsx`
5. Visual QA: compare against vite.dev header on desktop and mobile
