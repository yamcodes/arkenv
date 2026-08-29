---
"arkenv": minor
---

#### Add `-H` alias for the `init --host-preset` flag

`--host-preset` now accepts a short `-H` alias, matching the other CLI flags.

```bash
# These are equivalent
npx arkenv@latest init --host-preset vercel
npx arkenv@latest init -H vercel
```
