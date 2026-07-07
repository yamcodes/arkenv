---
"@arkenv/fumadocs-ui": patch
---

#### Export `TypeTable` and `Collapsible` components

Export `TypeTable` and `Collapsible` components from `@arkenv/fumadocs-ui/components`. The custom `TypeTable` component supports the `expandAll` prop to render all properties fully expanded by default.

Usage:

```tsx
import { TypeTable } from "@arkenv/fumadocs-ui/components";

<TypeTable
  type={{
    port: {
      type: "number",
      description: "The port to run the server on",
      default: "3000"
    }
  }}
  expandAll
/>
```
