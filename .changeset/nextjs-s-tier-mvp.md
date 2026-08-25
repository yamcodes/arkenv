---
"@arkenv/nextjs": minor
---

#### Add `isEnabled` Dead-Code Elimination (DCE) helper and virtualized `.arkenv/` hybrid barrel

- **`isEnabled` DCE Helper:** Exported `isEnabled<TEnv>(key, value)` across all `@arkenv/nextjs` entrypoints (main, client, react-server, standard, standard/client) to enable minifiers (SWC/Turbopack, Terser, ESBuild) to constant-fold and prune unused client feature branches while preserving TypeScript schema safety.
- **Virtualized `.arkenv/` Placement & Hybrid Barrel:** Updated default codegen output from `src/generated/env.gen.ts` to `.arkenv/env.gen.ts` with a companion `.arkenv/index.ts` barrel export, eliminating in-tree repository clutter.
- **Dual-Bundler Aliasing:** Enhanced `withArkEnv` to automatically configure `turbopack.resolveAlias` and Webpack `resolve.alias` for `@/.arkenv`, `.arkenv`, `.arkenv/env.gen`, and `#arkenv/env`.
- **Backward Compatibility:** Existing projects specifying a custom `outputPath` in `withArkEnv(config, { outputPath: "..." })` continue to work unchanged.

Usage Example:

```tsx
"use client";

import { isEnabled } from "@arkenv/nextjs";
import type { Env } from "@/env";

export function BetaComponent() {
  // Minifier inlines process.env -> ("false" === "true") -> false, eliminating dead branch
  if (
    isEnabled<Env>(
      "NEXT_PUBLIC_ENABLE_BETA",
      process.env.NEXT_PUBLIC_ENABLE_BETA,
    )
  ) {
    return <HeavyModule />;
  }

  return <StandardModule />;
}
```
