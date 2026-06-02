---
"@arkenv/cli": patch
---

#### Automatically wrap Next.js config with `withArkEnv` during `arkenv init`

Running `arkenv init` in a Next.js project now auto-detects `next.config.ts` (or `.js`/`.mts`/`.mjs`) and wraps the default export with `withArkEnv`:

```ts
// next.config.ts - before
export default {
  experimental: {}
}

// next.config.ts - after
import { withArkEnv } from "@arkenv/nextjs/config"
export default withArkEnv({
  experimental: {}
})
```

- Add `transformNextjsConfig` AST transformer to wrap default exports with `withArkEnv` using magicast
- Add `findNextjsConfig` and `bootstrapNextjsConfig` utilities for Next.js config discovery and mutation
- Integrate Next.js config bootstrapping into the CLI executor during `arkenv init`
- Fix next-steps suppression: show manual `withArkEnv` instructions even when the AI skill is detected if auto-bootstrapping failed
