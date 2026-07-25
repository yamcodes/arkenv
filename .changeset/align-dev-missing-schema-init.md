---
"@arkenv/build": patch
"@arkenv/bun-plugin": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
---

#### Make missing-schema errors short and actionable across hosts

When Bun, Next, or Nuxt cannot find an env schema, throw a consistent message that names the expected path / `schemaPath` and points to `npx @arkenv/cli@latest init`, without embedding a starter `env.ts` module.

Example:

```text
[ArkEnv] Could not find schema file at src/env.ts or env.ts. Please specify 'schemaPath' in ArkEnv options (or run `npx @arkenv/cli@latest init`).
```
