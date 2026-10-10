---
"@arkenv/nuxt": patch
---

#### Fix Nuxt 4.6 `nitro:config` hook types

`@arkenv/nuxt` typechecks again with Nuxt 4.6. The module no longer redeclares the `nitro:config` hook, which now uses Nuxt's `NitroConfig` type, and still registers the server boot alias on that hook.
