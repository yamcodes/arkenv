---
"@arkenv/cli": patch
---

#### Generate `env.d.ts` file for plugins

When installing the Vite plugin or the Bun plugin, a matching `env.d.ts` will be generated if one is not present.

This allows for typesafety when calling via `process.env` or `import.meta.env`, see: https://arkenv.js.org/docs/vite-plugin/typing-import-meta-env
