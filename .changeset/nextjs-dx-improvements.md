---
"@arkenv/nextjs": patch
---

#### Add non-wrapping setup API, dynamic client environment variables, and refactor parser integration

Improve the Next.js integration with the following enhancements:

- **Non-wrapping Setup API**: Expose `setupArkEnv` from `@arkenv/nextjs/config` and a side-effect import `@arkenv/nextjs/register` to allow setting up ArkEnv in `next.config.js` without wrapping the configuration.
- **Dynamic Client Environment Variables**: Implement `<ArkEnvScript />` component that runs during SSR to inject `NEXT_PUBLIC_*` environment variables dynamically into the browser (`globalThis.__arkenv_env__`), allowing containerized deployments to swap public variables at runtime without rebuilds.
- **Code Deduplication**: Refactor `@arkenv/nextjs/config` to import shared watcher, layout resolution, and key extraction helpers from `@arkenv/build`.

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
    <html>
      <head>
        <ArkEnvScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
```
