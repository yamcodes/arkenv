---
"@arkenv/nextjs": minor
---

#### Add `isEnabled` Dead-Code Elimination helper and virtualized `.arkenv/` aliasing

Exported the `isEnabled` helper for client-side compile-time dead-code elimination (DCE) in Next.js applications, and enhanced `withArkEnv` to automatically configure Turbopack and Webpack resolve aliases for virtualized `.arkenv/` placement.

Usage:

```tsx
"use client";
import { isEnabled } from "@arkenv/nextjs";
import type { Env } from "@/env";

export function BetaComponent() {
  if (isEnabled<Env>("NEXT_PUBLIC_ENABLE_BETA", process.env.NEXT_PUBLIC_ENABLE_BETA)) {
    return <HeavyModule />;
  }
  return <StandardModule />;
}
```
