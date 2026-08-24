---
"arkenv": minor
---

#### Collapse CLI scaffold to canonical env-object family and add v0 to v1 migration command

Scaffolding now consistently emits the canonical `export const env = arkenv({ ... })` surface across all supported frameworks (Next.js, Nuxt, Vite, Bun, and Node.js), eliminating legacy ambient declaration `.d.ts` generation and runtime dependency boilerplate.

Introduced the `arkenv migrate` command (`arkenv migrate [--dry-run]`) to automatically detect and rewrite legacy v0 patterns (`export const Env = ...`, `arkenvVitePlugin(Env)`, ambient `.d.ts` augmentations, and `package.json` dependencies) into modern v1 code.

Usage:

```bash
# Preview proposed migration changes
arkenv migrate --dry-run

# Automatically migrate project to v1
arkenv migrate
```
