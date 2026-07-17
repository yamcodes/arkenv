---
"@arkenv/nextjs": major
"@arkenv/nuxt": major
---

#### Remove framework `/shared` subpath exports

Drop the `./shared` export from `@arkenv/nextjs` and `@arkenv/nuxt`. Strict-layout internal schema modules should import `type` from `@arkenv/core` instead. `/client` and `/server` subpath exports are unchanged.

**BREAKING CHANGE:** Remove `@arkenv/nextjs/shared` and `@arkenv/nuxt/shared` subpath exports.

Migration:

```ts
// Before
import { type } from "@arkenv/nextjs/shared";

// After
import { type } from "@arkenv/core";
```

Import mental model:

- **Flat layout:** `import arkenv from "@arkenv/nextjs"` (or `@arkenv/nuxt`)
- **Strict layout:** `@arkenv/nextjs/client` and `@arkenv/nextjs/server` (or Nuxt equivalents)
- **Internal schema modules:** `import { type } from "@arkenv/core"`
