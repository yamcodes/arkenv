---
"@arkenv/nextjs": minor
---

#### Add a `react-server` condition to `@arkenv/nextjs/standard`

This is the client/server security boundary, not a bundle-size or runtime speedup. `@arkenv/nextjs/standard` previously always resolved the client build, so Server Components could not read server-only keys such as `DATABASE_URL`. It now uses the same export conditions as `@arkenv/nextjs`.

Next.js resolves `react-server` in Server Components and Route Handlers. That build exposes the full schema. Client Components and SSR still resolve the default build: public keys only, and a throw if client code reads a server-only key.

Generated `env.gen.ts` keeps importing `@arkenv/nextjs/standard`. Next.js selects the build.

```ts
import arkenv from "@arkenv/nextjs/standard";
import * as z from "zod";

export const env = arkenv({
  DATABASE_URL: z.url(),
  NEXT_PUBLIC_API_URL: z.url(),
});
```
