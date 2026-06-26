---
"@arkenv/nextjs": patch
---

#### Add non-wrapping setup API and dynamic client environment variables support

Improve the Next.js developer experience with the following enhancements:

- Expose `setupArkEnv` from `@arkenv/nextjs/config` and a side-effect import `@arkenv/nextjs/register` to register ArkEnv in `next.config.js` without wrapping the configuration object.
- Support runtime-injectable client-side variables via a new `<ArkEnvScript />` component, enabling containerized deployments to configure public client-side variables dynamically without rebuilds.
- Fix typesafety for the flat layout so that `env` returns a strongly-typed schema (rather than resolving to `any`) and server-side variables can be accessed in server components without TypeScript compile errors.

Usage:

```ts
// next.config.js
import "@arkenv/nextjs/register";

export default {
  // your normal next config
};
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
