---
"@arkenv/nuxt": patch
---

#### Enforce strict-layout Vite boundary for userland server imports

Extend the `@arkenv/nuxt/module` Vite plugin to block client-side imports of userland server-only schema files inside the configured strict-layout schema directory. The plugin now rejects any resolved module path ending with `/server` under the schema base directory, including imports via Nuxt aliases such as `~/env/server` and `~~/env/server`.

Server-side builds remain unaffected, and the existing branded error message is preserved:

```
[ArkEnv] Importing server-only environment schema on the client is not allowed!
```
