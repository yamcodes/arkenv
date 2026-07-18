# Nuxt strict layout playground

Fixture for Nuxt strict layout with server auto-extend.

`env/server.ts` intentionally omits `extends: [clientEnv]` - the module wires the merge.

`server/api/env.get.ts` exists so Nitro (not just Vite) resolves `#arkenv/client-env` and merges client/shared keys into the server env.
