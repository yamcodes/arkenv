---
"@arkenv/fumadocs-ui": patch
---

#### Expand `css/theme.css`

`@arkenv/fumadocs-ui/css/theme.css` now includes a complete set of fumadocs override styles so any app importing the theme gets correct defaults out of the box: nav/header height variables, sidebar drawer positioning (left-side on mobile), z-index stack (header → backdrop → sidebar drawer → search dialog → Radix poppers), search bar colors, external link icons, link underline styles, and heading anchor alignment.
