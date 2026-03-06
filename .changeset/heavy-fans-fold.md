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
  actions={[<ThemeToggle />, <GitHubLink />]}
/>
```

The header is fixed to the top of the viewport and adapts its appearance as the user scrolls — transparent when at the top of the page, blurred with a semi-transparent background once the user scrolls down.
