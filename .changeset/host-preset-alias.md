---
"@arkenv/cli": patch
---

#### Add `-p` alias for the `init --host-preset` flag

`--host-preset` now accepts a short `-p` alias, matching the other CLI flags.

```bash
# These are equivalent
npx @arkenv/cli@latest init --host-preset vercel
npx @arkenv/cli@latest init -p vercel
```
