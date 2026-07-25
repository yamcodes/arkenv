---
"@arkenv/build": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
---

#### Make `env/internal/shared.ts` optional in strict layout

Strict layout now works with just `client.ts` and `server.ts`. Omit `internal/shared.ts` when you have nothing to share — shared keys are treated as empty.

```ts
// env/client.ts + env/server.ts alone is enough
export default withArkEnv(nextConfig, {
  layout: "strict",
});
```

The CLI still scaffolds `shared.ts` by default for convenience.
