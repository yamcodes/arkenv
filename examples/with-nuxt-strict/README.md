# Nuxt strict layout example

Example for Nuxt strict layout with client and server auto-extend.

`env/client.ts` intentionally omits `extends: [SharedSchema]`, and `env/server.ts`
omits `extends: [clientEnv]` - the module wires both merges.

`server/api/health.get.ts` uses the server env in a minimal health endpoint. It
reads the shared `NODE_ENV` value through the auto-extended server env, while
keeping `DATABASE_URL` server-only.
