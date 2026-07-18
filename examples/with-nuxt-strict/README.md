# Nuxt strict layout playground

Fixture for Nuxt strict layout with server auto-extend.

`env/server.ts` intentionally omits `extends: [clientEnv]` - the module wires the merge.

`server/api/health.get.ts` uses the server env in a minimal health endpoint. It
reads the shared `NODE_ENV` value through the auto-extended server env, while
keeping `DATABASE_URL` server-only.
