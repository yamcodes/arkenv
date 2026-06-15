---
"@arkenv/nuxt": patch
"@arkenv/cli": patch
"@arkenv/build": patch
---

#### Introduce Nuxt support

Introduce `@arkenv/nuxt` integration package providing a Nuxt module for automatic environment variable validation and runtimeConfig mapping, and add Nuxt support to the CLI scaffold wizard. The Nuxt adapter elegantly embraces Nuxt's native configuration exposure by automatically reading from `window.__NUXT__.config.public`, eliminating the need for developers to manually pass a `runtimeEnv` or `useRuntimeConfig()` map.
