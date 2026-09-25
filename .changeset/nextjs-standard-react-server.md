---
"@arkenv/nextjs": minor
---

#### Add a `react-server` condition to `@arkenv/nextjs/standard`

`@arkenv/nextjs/standard` now follows the same export boundary as `@arkenv/nextjs`. Server Components and Route Handlers resolve the full schema. Client Components and SSR still resolve public keys only. Generated `env.gen.ts` keeps importing `@arkenv/nextjs/standard`; Next.js selects the build.

```ts
import arkenv from "@arkenv/nextjs/standard";
import * as z from "zod";

export const env = arkenv({
  DATABASE_URL: z.url(),
  NEXT_PUBLIC_API_URL: z.url(),
});
```
