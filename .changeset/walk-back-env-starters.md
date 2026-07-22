---
"@arkenv/bun-plugin": patch
"@arkenv/nuxt": patch
---

#### Drop embedded env.ts starters and warn when the Nuxt module finds no schema

Keep missing-schema guidance short and host-parity consistent: Bun no longer embeds ArkType/Zod starters in the hybrid discovery error (prefer `arkenv init` / docs). When the Nuxt module is registered but no schema file is found, log a build warning and skip setup instead of failing silently.
