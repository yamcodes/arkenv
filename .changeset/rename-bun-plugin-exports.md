---
"@arkenv/bun-plugin": major
---

#### Rename Bun plugin exports to `arkenvPlugin`

The primary exports from `@arkenv/bun-plugin` and `@arkenv/bun-plugin/standard` have been renamed to `arkenvPlugin`, with named aliases `arkenvBunPlugin` and `hybrid`. The previously exposed named `arkenv` export has been removed.

The hybrid callable/zero-config interface for Bun continues to be supported on `arkenvPlugin` and the `hybrid` alias.

Usage in Bun build scripts (`build.ts`):

```ts
import arkenvPlugin, { arkenvBunPlugin, hybrid } from "@arkenv/bun-plugin";

await Bun.build({
  entrypoints: ["./src/index.tsx"],
  outdir: "./dist",
  plugins: [arkenvPlugin],
});
```

**BREAKING CHANGE:** Removed named `arkenv` export from `@arkenv/bun-plugin`. Use `arkenvPlugin`, `arkenvBunPlugin`, or `hybrid` instead.

```diff
- import { arkenv } from "@arkenv/bun-plugin";
+ import { arkenvPlugin } from "@arkenv/bun-plugin";
```
