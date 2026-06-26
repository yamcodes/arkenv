---
"@arkenv/nextjs": patch
---

#### Add standalone setup API and dynamic client environment variables support

Improve the Next.js developer experience with the following enhancements:

- Expose `setupArkEnv` from `@arkenv/nextjs/config` as a non-wrapping alternative to `withArkEnv`. Use it directly when you are already juggling multiple config wrappers and want to avoid another `withX(...)` layer.
- Remove the `@arkenv/nextjs/register` side-effect import; use `withArkEnv` for the idiomatic wrapper path or `setupArkEnv` for the non-wrapping path.
- Support runtime-injectable client-side variables via a new `<ArkEnvScript />` component, enabling containerized deployments to configure public client-side variables dynamically without rebuilds.
- Fix typesafety for the flat layout so that `env` returns a strongly-typed schema (rather than resolving to `any`) and server-side variables can be accessed in server components without TypeScript compile errors.

Usage:

```ts
// next.config.ts
import { withArkEnv } from "@arkenv/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};
export default withArkEnv(nextConfig);
```

```tsx
// app/layout.tsx
import { ArkEnvScript } from "@arkenv/nextjs";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ArkEnvScript />
        {children}
      </body>
    </html>
  );
}
```
