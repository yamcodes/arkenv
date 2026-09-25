---
"@arkenv/nextjs": minor
---

#### Add a `react-server` condition to `@arkenv/nextjs/standard`

Server Components and Route Handlers can read server-only keys such as `DATABASE_URL` from `@arkenv/nextjs/standard`. Client Components and SSR still see public keys only. Reading a server-only key on the client throws.

```ts
import arkenv from "@arkenv/nextjs/standard";
import * as z from "zod";

export const env = arkenv({
  DATABASE_URL: z.url(),
  NEXT_PUBLIC_API_URL: z.url(),
});
```
