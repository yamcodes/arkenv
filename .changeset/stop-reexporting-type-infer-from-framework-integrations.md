---
"@arkenv/nextjs": major
"@arkenv/nuxt": major
---

#### Stop re-exporting `type` and `Infer` from framework integrations

**BREAKING CHANGE:** Remove redundant `type` and `Infer` re-exports from `@arkenv/nextjs` (root, `/client`, `/server`, `/react-server`) and `@arkenv/nuxt` (root). Next.js codegen templates (`env.gen.ts`) also no longer emit `export { type }`.

Import schema definition helpers (`type`, `Infer`) directly from `@arkenv/core` instead:

```ts
// Before
import { type, Infer } from "@arkenv/nextjs";
// or
import { type } from "@arkenv/nextjs/client";

// After
import { type, type Infer } from "@arkenv/core";
```
