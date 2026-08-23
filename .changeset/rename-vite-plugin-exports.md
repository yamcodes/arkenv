---
"@arkenv/vite-plugin": minor
---

#### Add `arkenvPlugin` and `arkenvVitePlugin` named exports

`@arkenv/vite-plugin` and `@arkenv/vite-plugin/standard` now export `arkenvPlugin` and `arkenvVitePlugin` as named exports alongside the default export.

This aligns Vite plugin imports with ecosystem conventions and prevents identifier collisions with the core `arkenv(...)` schema builder in `vite.config.ts`.

Usage in `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import arkenvPlugin from "@arkenv/vite-plugin";

export default defineConfig({
  plugins: [arkenvPlugin()],
});
```
