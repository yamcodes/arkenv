---
"@arkenv/build": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
"@arkenv/vite-plugin": patch
"@arkenv/bun-plugin": patch
---

#### Make `env/internal/shared.ts` optional in strict layout

Strict layout auto-detection and schema discovery now treat `client.ts` + `server.ts` as enough. Explicit `layout: "strict"` no longer requires `internal/shared.ts`; when the file is absent, shared keys are treated as empty.

```ts
// env/client.ts + env/server.ts alone is valid strict layout
export default withArkEnv(nextConfig, {
  layout: "strict",
});
```

On Nuxt, `#arkenv/shared-schema` / client auto-extend uses the empty-schema stub when `internal/shared.ts` is omitted (same fallback already used outside strict). A present shared file without a usable `SharedSchema` export still fails with a clear diagnostic.

Vite and Bun plugins remain flat-layout only: if discovery finds a strict `env/` directory, they reject it with a clear diagnostic instead of treating the directory as an env module file.

The CLI still scaffolds `shared.ts` by default for convenience.
