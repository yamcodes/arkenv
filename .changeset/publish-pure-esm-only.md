---
"@arkenv/core": major
"@arkenv/standard": major
"arkenv": major
"@arkenv/agent-plugin": major
"@arkenv/build": major
"@arkenv/bun-plugin": major
"@arkenv/fumadocs-ui": major
"@arkenv/nextjs": major
"@arkenv/nuxt": major
"@arkenv/vite-plugin": major
---

#### Migrate all packages to pure ESM-only output

Every package now ships standard `.js` and `.d.ts` files under `"type": "module"`. The dual-published `.mjs`, `.cjs`, `.d.mts`, and `.d.cts` artifacts have been removed, and package `exports` no longer carry `require` conditions.

CommonJS consumers keep working through Node's native `require(esm)`, which resolves each package through its `"default"` export condition. Bundlers (esbuild, Vite, Rollup, webpack) continue to transpile and inline the ESM output cleanly.

**BREAKING CHANGE**: ArkEnv packages no longer ship `.cjs` builds. `require()` now returns the ESM namespace (for example, `require("@arkenv/core").default` is the `arkenv` function) and requires Node.js 20.19+, 22.12+, or 24. Projects that load ArkEnv from CommonJS on older Node versions need to upgrade Node or move to `import` syntax.
