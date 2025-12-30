---
"@arkenv/vite-plugin": patch
---

#### Support Vite's `envDir` for custom env directories

The plugin now internally passes along [Vite's `envDir` config option](https://vite.dev/config/shared-options.html#envdir), allowing users to specify a custom directory for environment files.
