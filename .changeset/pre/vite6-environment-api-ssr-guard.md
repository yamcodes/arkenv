---
"@arkenv/vite-plugin": minor
---

#### Add Vite 6 Environment API support to the SSR transform guard

The Vite plugin now detects server graphs through the Vite 6 Environment API. Environments with `consumer: "server"` (or named `ssr`) keep the real `env.ts` module so validation runs at boot; everything else gets the client rewrite with inlined `VITE_*` values. On Vite 4 and 5 the legacy `ssr` transform flag is still used as a fallback.
