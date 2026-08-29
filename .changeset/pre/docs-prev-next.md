---
"@arkenv/fumadocs-ui": minor
---

#### Add a Turborepo-style previous/next pager for docs pages

Export `DocsFooter` so a Fumadocs `DocsPage` can replace the default bordered cards with a hairline rule, Previous/Next labels, and destination titles.

Usage:

```tsx
import { DocsFooter } from "@arkenv/fumadocs-ui/components";
import { DocsPage } from "fumadocs-ui/page";

<DocsPage
  slots={{
    footer: DocsFooter,
  }}
>
  {children}
</DocsPage>;
```
