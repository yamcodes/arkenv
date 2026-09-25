---
"@arkenv/rsbuild-plugin": major
---

#### Export only `arkenvPlugin` from the Rsbuild plugin

`@arkenv/rsbuild-plugin` and `@arkenv/rsbuild-plugin/standard` now export `arkenvPlugin` as the default and the only named export. The `arkenvRsbuildPlugin` alias has been removed.

```ts
import { arkenvPlugin } from "@arkenv/rsbuild-plugin";

export default defineConfig({
  plugins: [arkenvPlugin()],
});
```

**BREAKING CHANGE**: `arkenvRsbuildPlugin` is no longer exported. Import `arkenvPlugin` instead.
