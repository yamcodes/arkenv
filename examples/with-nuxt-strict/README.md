# Nuxt strict layout playground

Fixture for Nuxt strict layout with server auto-extend.

`env/server.ts` intentionally omits `extends: [clientEnv]` - the module wires the merge.

`server/api/env.get.ts` is a playground-only smoke route (not part of ArkEnv setup). It imports `~~/env/server` so the fixture build exercises Nitro's alias wiring; any real server file that imports server env would do the same.
