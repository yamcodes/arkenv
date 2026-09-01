---
"@arkenv/core": patch
"arkenv": patch
"@arkenv/standard": patch
"@arkenv/agent-plugin": patch
"@arkenv/build": patch
"@arkenv/bun-plugin": patch
"@arkenv/fumadocs-ui": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
"@arkenv/vite-plugin": patch
---

#### Reduce package install sizes by omitting sourcemaps and externalizing core types

Published packages now omit declaration maps (`.d.ts.map`, `.d.mts.map`, `.d.cts.map`) and runtime JavaScript sourcemaps (`*.map`) across the monorepo, significantly reducing npm install footprints and package archive sizes.

In addition, public ArkType type contracts in `@arkenv/core` declarations are now externalized rather than recursively expanded by the compiler, shrinking `@arkenv/core` declaration files and preventing internal AST definitions from being inlined into consumer type builds.
