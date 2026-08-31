---
"arkenv": patch
"@arkenv/cli": patch
"@arkenv/build": patch
"@arkenv/bun-plugin": patch
"@arkenv/fumadocs-ui": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
"@arkenv/vite-plugin": patch
---

#### Reduce package install sizes by omitting sourcemaps and externalizing core types

Omit declaration maps (`.d.ts.map`, `.d.mts.map`, `.d.cts.map`) and runtime JavaScript sourcemaps (`*.map`) monorepo-wide across published packages. Externalize public ArkType type contracts in `arkenv` declarations to avoid inlining internal AST definitions into `dist/index.d.mts`.
