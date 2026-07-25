---
"@arkenv/build": patch
"@arkenv/bun-plugin": patch
"@arkenv/vite-plugin": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
---

#### Make missing-schema errors short and actionable across hosts

When a host cannot find an env schema, throw a consistent message that names the expected path / `schemaPath` and points to `npx arkenv@latest init`, without embedding a starter `env.ts` module.

Example:

```text
[ArkEnv] Could not find schema file at src/env.ts or env.ts. Please specify 'schemaPath' in ArkEnv options (or run `npx arkenv@latest init`).
```
