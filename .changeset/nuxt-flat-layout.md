---
"@arkenv/nuxt": patch
"@arkenv/build": patch
---

#### Add flat layout support to `@arkenv/nuxt`

Introduce flat layout schema support and typesafe `createEnv` signature overloads to `@arkenv/nuxt`.

- Add `"flat"` layout mode to `ModuleOptions` and auto-detect it when a single `env.ts` file is configured.
- Emit a deprecation warning in development when using the legacy `"simple"` layout option.
- Expose flat `createEnv(schema, options)` overload with type inference for `NUXT_PUBLIC_` prefixes, `NODE_ENV`, and custom `exposeToClient` variables.
