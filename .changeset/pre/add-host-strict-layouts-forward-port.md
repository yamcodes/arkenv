---
"arkenv": minor
---

#### Support `arkenv add host` for strict multi-file layouts

Support `arkenv add host [provider]` in projects with strict multi-file layouts (`client.ts` and `server.ts`). Automatically partition preset variables into client-prefixed keys for `client.ts` and server-only keys for `server.ts`. Align help text and docs so `add host` is not described as flat-`env.ts`-only.

Usage:

```bash
npx arkenv@latest add host [provider]
```
