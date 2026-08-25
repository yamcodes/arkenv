---
"@arkenv/nextjs": minor
---

#### Add virtualized `.arkenv/` hybrid barrel placement and dual-bundler aliasing

- **Virtualized `.arkenv/` Placement & Hybrid Barrel:** Updated default codegen output from `src/generated/env.gen.ts` to `.arkenv/env.gen.ts` with a companion `.arkenv/index.ts` barrel export, eliminating in-tree repository clutter.
- **Dual-Bundler Aliasing:** Enhanced `withArkEnv` to automatically configure `turbopack.resolveAlias` and Webpack `resolve.alias` for `@/.arkenv`, `.arkenv`, `.arkenv/env.gen`, and `#arkenv/env`.
- **Backward Compatibility:** Existing projects specifying a custom `outputPath` in `withArkEnv(config, { outputPath: "..." })` continue to work unchanged.

Usage Example:

```ts
import arkenv from "@/.arkenv";

export const env = arkenv({
  DATABASE_URL: "string",
  NEXT_PUBLIC_API_URL: "string",
});
```
