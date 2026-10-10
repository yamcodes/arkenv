---
"@arkenv/nuxt": patch
---

#### Compile the Nuxt schema into the Nitro server bundle

Production startup and prerender now validate the schema compiled into the server bundle. A copied `.output` directory no longer reads the build-machine `env.ts` and no longer needs `jiti`. Live `NUXT_*` and `NUXT_PUBLIC_*` overrides, including empty strings, still win over values baked at build time.
