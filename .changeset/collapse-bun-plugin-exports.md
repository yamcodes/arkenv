---
"@arkenv/bun-plugin": major
---

#### Export only `arkenvPlugin` from the Bun plugin

`@arkenv/bun-plugin` and `@arkenv/bun-plugin/standard` now export `arkenvPlugin` as the default and the only named export. The `arkenvBunPlugin` and `hybrid` aliases have been removed. `arkenvPlugin` is still both a factory and a plugin object with `name`, `target`, and `setup`.

```ts
import arkenvPlugin from "@arkenv/bun-plugin";

await Bun.build({
  plugins: [arkenvPlugin],
});
```

**BREAKING CHANGE**: `arkenvBunPlugin` and `hybrid` are no longer exported. Use `arkenvPlugin` instead.
