---
"@arkenv/build": minor
"@arkenv/vite-plugin": minor
"@arkenv/bun-plugin": minor
---

#### Add strict layout support and compile-time import blocking to Vite and Bun plugins

Added strict layout (`env/client.ts`, `env/server.ts`) support to `@arkenv/vite-plugin` and `@arkenv/bun-plugin` with compile-time import blocking:

- Configured `@arkenv/vite-plugin` to reject client-graph imports of server-only environment schemas during build with a descriptive error.
- Enforced compile-time server schema import blocking in `@arkenv/bun-plugin` for `target: "browser"` builds.
- Added strict layout resolution and server schema detection utilities to `@arkenv/build` to share security mechanisms across bundler integrations.
- Preserved existing flat layout transform behavior and zero-validator client bundle inlining.
