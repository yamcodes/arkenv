---
"@arkenv/fumadocs-ui": minor
---

#### Add Turborepo-style drill-in sidebar for Fumadocs docs layouts

Export `drillInSidebarSlots` (and `DrillInSidebar`) so a Fumadocs `DocsLayout` can replace the default accordion sidebar with one-level section drill-in. Also export `DocsBreadcrumb` and `docsTocSlots` for matching docs chrome.

Usage:

```tsx
import { drillInSidebarSlots } from "@arkenv/fumadocs-ui/components";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

<DocsLayout
  tree={source.pageTree}
  slots={{
    sidebar: drillInSidebarSlots,
  }}
>
  {children}
</DocsLayout>;
```
