---
"arkenv": minor
---

#### Scaffold `arkenvPlugin` in Vite and Rsbuild configs

`arkenv init` now writes `arkenvPlugin` into new Vite and Rsbuild config entries. Vite binds the default import as `arkenvPlugin`. Rsbuild imports the named `arkenvPlugin`.

```ts
import arkenvPlugin from "@arkenv/vite-plugin";

export default defineConfig({
  plugins: [arkenvPlugin()],
});
```
