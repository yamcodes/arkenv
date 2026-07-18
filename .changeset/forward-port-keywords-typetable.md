---
"@arkenv/fumadocs-ui": minor
---

#### Export `TypeTable` and `Collapsible` components

Export `TypeTable` and `Collapsible` from `@arkenv/fumadocs-ui/components`. The custom `TypeTable` supports `expandAll` to render all properties expanded by default.

Usage:

```tsx
import { TypeTable } from "@arkenv/fumadocs-ui/components";

<TypeTable
  type={{
    port: {
      type: "number",
      description: "The port to run the server on",
      default: "3000",
    },
  }}
  expandAll
/>;
```
