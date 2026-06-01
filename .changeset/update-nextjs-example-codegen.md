---
"@arkenv/nextjs": patch
---

#### Update Next.js example and playground to use codegen

Migrate the Next.js example (`examples/with-nextjs`) and playground (`apps/playgrounds/nextjs`) to the unified 1-file layout using `@arkenv/nextjs/config`'s `withArkEnv` helper and codegen. This eliminates manual `runtimeEnv` boilerplate in the example.
