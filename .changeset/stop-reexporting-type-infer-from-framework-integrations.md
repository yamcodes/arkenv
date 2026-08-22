---
"@arkenv/nextjs": major
"@arkenv/nuxt": major
---

#### Stop re-exporting `type` and `Infer` from framework integrations

Removed redundant `type` and `Infer` re-exports from `@arkenv/nextjs` (root, `/client`, `/server`, `/react-server`) and `@arkenv/nuxt` (root). Next.js codegen templates (`env.gen.ts`) also stopped emitting `export { type }`.

Schema definition helpers (`type`, `Infer`) are now imported directly from `@arkenv/core`:

```ts
// Before
import { type, Infer } from "@arkenv/nextjs";
// or
import { type } from "@arkenv/nextjs/client";

// After
import { type, type Infer } from "@arkenv/core";
```

**BREAKING CHANGE:** Removed `type` and `Infer` re-exports from `@arkenv/nextjs` and `@arkenv/nuxt`. Import schema helpers directly from `@arkenv/core`.
