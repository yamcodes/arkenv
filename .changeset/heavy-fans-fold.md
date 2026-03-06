---
"@arkenv/fumadocs-ui": patch
---

#### Add `Header` component

`@arkenv/fumadocs-ui` now exports a `Header` component for building site-wide navigation headers.

```tsx
import { Header } from "@arkenv/fumadocs-ui/components";

<Header
  logo={<MyLogo />}
  links={[
    { text: "Docs", url: "/docs" },
    { text: "Blog", url: "/blog" },
  ]}
  actions={[<SearchToggle />, <ThemeToggle />]}
  menuActions={[<ThemeToggle />]}
  menuSocialActions={[<GitHubLink />]}
  sidebarTrigger={<MySidebarTrigger />}
/>
```

The header is fixed to the top of the viewport and adapts its appearance as the user scrolls — transparent when at the top of the page, blurred with a semi-transparent background once the user scrolls down.

On mobile the header renders a full-screen dropdown menu. Nav links are stacked at the top, an "Appearance" row (label + `menuActions`) sits above a centered row of `menuSocialActions`. An optional `sidebarTrigger` slot renders left of the logo for layouts that have a docs sidebar.
