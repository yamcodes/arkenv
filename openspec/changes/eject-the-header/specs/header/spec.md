## ADDED Requirements

### Requirement: Header Component
The `@arkenv/fumadocs-ui` package MUST export a `Header` React component that renders the site-wide navigation header.

#### Scenario: Export availability
- **WHEN** a consumer imports from `@arkenv/fumadocs-ui/components`
- **THEN** `Header` MUST be available as a named export

#### Scenario: Logo slot
- **WHEN** `Header` is rendered with a `logo` prop
- **THEN** it MUST render that ReactNode on the left side of the header

#### Scenario: Navigation links
- **WHEN** `Header` is rendered with a `links` prop (array of `{ text: string, url: string }`)
- **THEN** it MUST render each link as a navigation anchor in the center of the header

#### Scenario: Action slots
- **WHEN** `Header` is rendered with an `actions` prop (array of ReactNode)
- **THEN** it MUST render those nodes on the right side of the header

### Requirement: Scroll-Aware Styling
The `Header` component MUST adapt its visual appearance based on the page scroll position.

#### Scenario: Transparent at top
- **WHEN** the page scroll position is at the top (scrollY === 0)
- **THEN** the header background MUST be transparent (no visible background fill)

#### Scenario: Blurred on scroll
- **WHEN** the page has been scrolled down past a threshold
- **THEN** the header MUST apply a backdrop-blur and a semi-transparent background

### Requirement: Fixed Positioning
The `Header` component MUST be positioned fixed at the top of the viewport.

#### Scenario: Fixed layout
- **WHEN** `Header` is rendered
- **THEN** it MUST have `position: fixed` (or equivalent Tailwind class) so it stays visible as the user scrolls

#### Scenario: Z-index
- **WHEN** `Header` is rendered
- **THEN** it MUST have a z-index high enough to appear above page content and the fumadocs sidebar
