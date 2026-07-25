---
"@arkenv/build": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
"@arkenv/vite-plugin": patch
"@arkenv/bun-plugin": patch
---

#### Make `env/internal/shared.ts` optional in strict layout

Strict layout now works with just `client.ts` and `server.ts`. Omit `internal/shared.ts` when you have nothing to share — shared keys are treated as empty.

```ts
// env/client.ts + env/server.ts alone is enough
export default withArkEnv(nextConfig, {
  layout: "strict",
});
```

On Nuxt, omitting the shared file still auto-merges an empty schema into the client entry. If the file is present, it must export `SharedSchema`.

Vite and Bun plugins only support a flat `env.ts`; a strict `env/` directory now fails with a clear error instead of a confusing filesystem failure.

The CLI still scaffolds `shared.ts` by default for convenience.
