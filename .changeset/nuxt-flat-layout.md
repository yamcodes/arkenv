---
"@arkenv/nuxt": minor
"@arkenv/build": patch
---

#### Add core API and flat layout support to `@arkenv/nuxt`

Introduce flat layout schema support and signature overloads to `@arkenv/nuxt` mirroring Next.js parity.

- Add `"flat"` layout mode to `ModuleOptions` and auto-detect it for a single `env.ts` file.
- Emit a deprecation warning in development when using the legacy `"simple"` layout option.
- Parameterize `@arkenv/build`'s `extractKeys` helper to accept a framework public prefix (e.g. `"NUXT_PUBLIC_"` or `"NEXT_PUBLIC_"`), avoiding duplicate parser code.
- Categorize flat layout keys in `createEnvInternal` using `NUXT_PUBLIC_`, `NODE_ENV`, and `exposeToClient`.
- Expose flat `createEnv(schema, options)` signature overload from `@arkenv/nuxt` with proper TypeScript inference.
