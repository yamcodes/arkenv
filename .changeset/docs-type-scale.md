---
"@arkenv/fumadocs-ui": patch
---

#### Match docs type to Turborepo/geistdocs

Use Geist 450 with the geistdocs heading scale (40px page title, 24px `h2`). Article text uses Turbo's rendering (`antialiased`, `ss11`, `calt` off) so in-page headings match, not just the page title. Sidebar labels use 14px / 500 (`text-button-14`). Compact page actions stay 12px / 500 like Turbo's `text-label-12`.
