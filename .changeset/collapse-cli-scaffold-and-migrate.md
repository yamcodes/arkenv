---
"arkenv": minor
---

#### Collapse CLI scaffold to canonical env-object family

Scaffolding now consistently emits the canonical `export const env = arkenv({ ... })` surface across all supported frameworks (Next.js, Nuxt, Vite, Bun, and Node.js), eliminating legacy ambient declaration `.d.ts` generation and runtime dependency boilerplate per ADR 0021 (Option 3).

Vite and Bun scaffolding now generate the standard `import { env } from "./env"` schema and configure zero-argument plugin registration.
