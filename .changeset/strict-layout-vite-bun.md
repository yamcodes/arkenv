---
"@arkenv/build": minor
"@arkenv/vite-plugin": minor
"@arkenv/bun-plugin": minor
---

#### Add strict layout support and compile-time import blocking to Vite and Bun plugins

Added strict layout (`env/client.ts`, `env/server.ts`) support to `@arkenv/vite-plugin` and `@arkenv/bun-plugin` with compile-time import blocking in accordance with ADR 0013 and ADR 0016:

- Generalized the client-import blocker in `@arkenv/vite-plugin` so any client-graph import of `/server` schema files fails the Vite build with a descriptive security error.
- Enforced compile-time client-import blocking in `@arkenv/bun-plugin` via `onResolve` and `onLoad` hooks for `target: "browser"` builds.
- Added `CLIENT_SECURITY_ERROR` and `isServerSchemaImport` to `@arkenv/build` to share strict layout resolution and import blocking logic across bundler integrations.
- Preserved existing flat layout transform behavior and zero-validator client bundle inlining.
