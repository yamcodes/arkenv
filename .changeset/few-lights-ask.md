---
"@arkenv/bun-plugin": patch
---

#### Support `NODE_ENV` in schema

When `NODE_ENV` is included in your schema, it is now validated at startup and correctly typed.

```ts
// src/env.ts
import { type } from "arkenv";

export default type({
  BUN_PUBLIC_API_URL: "string.url",
  NODE_ENV: "'development' | 'production' | 'test'",
});
```

```tsx
// process.env.NODE_ENV is now typed as "development" | "production" | "test"
<p>Mode: {process.env.NODE_ENV}</p>
```
