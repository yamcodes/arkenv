---
"@arkenv/vite-plugin": major
---

#### Export only `arkenvPlugin` from the Vite plugin

`@arkenv/vite-plugin` and `@arkenv/vite-plugin/standard` now export `arkenvPlugin` as the default and the only named export. The `arkenvVitePlugin` alias has been removed.

```ts
import arkenvPlugin from "@arkenv/vite-plugin";

export default defineConfig({
  plugins: [arkenvPlugin()],
});
```

**BREAKING CHANGE**: `arkenvVitePlugin` is no longer exported. Import `arkenvPlugin` instead.
