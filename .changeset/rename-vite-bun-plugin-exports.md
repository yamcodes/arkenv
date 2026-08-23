---
"@arkenv/vite-plugin": major
"@arkenv/bun-plugin": major
---

#### Rename bundler plugin exports to `arkenvPlugin`

The primary exports from `@arkenv/vite-plugin` and `@arkenv/bun-plugin` (and their `/standard` subpaths) have been renamed from `arkenv` to `arkenvPlugin` to eliminate namespace collisions with the core `arkenv(...)` schema builder from `@arkenv/core`.

Both plugins now provide host-explicit named aliases (`arkenvVitePlugin` and `arkenvBunPlugin`). The hybrid callable/zero-config interface for Bun continues to be supported on `arkenvPlugin` and the `hybrid` alias.

Usage in `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import arkenvPlugin, { arkenvVitePlugin } from "@arkenv/vite-plugin";

export default defineConfig({
  plugins: [arkenvPlugin()],
});
```

Usage in Bun build scripts (`build.ts`):

```ts
import arkenvPlugin, { arkenvBunPlugin, hybrid } from "@arkenv/bun-plugin";

await Bun.build({
  entrypoints: ["./src/index.tsx"],
  outdir: "./dist",
  plugins: [arkenvPlugin],
});
```

**BREAKING CHANGE:** Renamed plugin export from `arkenv` to `arkenvPlugin`.

```diff
- import arkenv from "@arkenv/vite-plugin";
+ import arkenvPlugin from "@arkenv/vite-plugin";

- import arkenv from "@arkenv/bun-plugin";
+ import arkenvPlugin from "@arkenv/bun-plugin";
```
