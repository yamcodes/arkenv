---
"@arkenv/cli": patch
---

#### Support `arkenv add host` for strict multi-file layouts

Support `arkenv add host [provider]` in projects with strict multi-file layouts (`client.ts` and `server.ts`). Automatically partition preset variables into client-prefixed keys for `client.ts` and server-only keys for `server.ts`.

Usage:

```bash
npx @arkenv/cli@latest add host [provider]
```
