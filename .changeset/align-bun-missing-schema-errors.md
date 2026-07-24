---
"@arkenv/bun-plugin": patch
---

#### Align Bun missing-schema errors with other hosts

Use the same short, actionable missing-schema style as Next, Nuxt, and Vite: list the checked paths and point to `arkenv init`, without embedding a starter `env.ts` module in the thrown error.
