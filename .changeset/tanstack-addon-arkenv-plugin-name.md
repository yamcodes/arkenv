---
"@arkenv/tanstack-addon": patch
---

#### Scaffold `arkenvPlugin` in the TanStack add-on

The TanStack CLI add-on now registers the Vite plugin as `arkenvPlugin`.

```ts
import arkenvPlugin from "@arkenv/vite-plugin";

export default defineConfig({
  plugins: [arkenvPlugin()],
});
```
