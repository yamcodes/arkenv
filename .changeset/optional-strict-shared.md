---
"@arkenv/build": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
---

#### Make `env/internal/shared.ts` optional in strict layout

Strict layout auto-detection and schema discovery now treat `client.ts` + `server.ts` as enough. Explicit `layout: "strict"` no longer requires `internal/shared.ts`; when the file is absent, shared keys are treated as empty.

```ts
// env/client.ts + env/server.ts alone is valid strict layout
export default withArkEnv(nextConfig, {
  layout: "strict",
});
```

The CLI still scaffolds `shared.ts` by default for convenience.
