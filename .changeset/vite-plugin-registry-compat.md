---
"@arkenv/vite-plugin": patch
---

#### Declare Vite-only compatibility for the plugin registry

Marked Rollup and Rolldown as incompatible in `compatiblePackages` with reason "Uses Vite-specific APIs". The plugin uses Vite `loadEnv` and the `config` hook, so it is not a standalone Rollup or Rolldown plugin.
