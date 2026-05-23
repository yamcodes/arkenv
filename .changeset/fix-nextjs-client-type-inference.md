---
"@arkenv/nextjs": patch
---

#### Fix client variable type inference

Client environment variables now correctly infer their validated type instead of resolving to `never` for non-`NEXT_PUBLIC_` keys.

```ts
const env = createEnv({
  client: {
    NEXT_PUBLIC_API_URL: "string",
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: "https://api.example.com",
  },
})

env.NEXT_PUBLIC_API_URL // previously `never`, now `string`
```
