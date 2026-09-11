---
"@arkenv/vite-plugin": patch
---

#### Guarantee Vite startup validation

The Vite plugin now has regression coverage for validating `env.ts` during
config resolution and revalidating environment changes during HMR. The
documented plugin contract makes startup failures explicit:

```ts
export default defineConfig({
  plugins: [arkenvPlugin()],
});
```

With the plugin registered, invalid environment variables abort startup before
Vite is ready. Without it, validation remains import-driven.
