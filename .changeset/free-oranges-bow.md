---
"@arkenv/vite-plugin": patch
---

#### `ImportMetaEnvAugmented` type helper for typesafe `import.meta.env`

Add a new `ImportMetaEnvAugmented` type that augments `import.meta.env` with your environment variable schema. This provides full type safety and autocomplete for all your `VITE_*` environment variables in client code.

Implementation inspired by [Julien-R44](https://github.com/Julien-R44)'s [vite-plugin-validate-env](https://github.com/Julien-R44/vite-plugin-validate-env#typing-importmetaenv).
