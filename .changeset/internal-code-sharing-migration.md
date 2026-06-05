---
"arkenv": patch
"@arkenv/vite-plugin": patch
"@arkenv/bun-plugin": patch
"@arkenv/nextjs": patch
---

#### Consolidate internal workspace packages into `arkenv/internal`

Expose a new `./internal` subpath export from the core `arkenv` package and refactor framework plugins to import shared scope and types utilities from `arkenv/internal` instead of standalone workspace packages.
