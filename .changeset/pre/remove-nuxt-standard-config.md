---
"@arkenv/nuxt": major
---

#### Remove the `@arkenv/nuxt/standard/config` subpath

`@arkenv/nuxt/standard/config` is no longer published. That entry only re-exported build helpers and was not a Standard Schema setup. Standard Schema apps still import the runtime from `@arkenv/nuxt/standard` and register `@arkenv/nuxt/standard/module`.

```ts
import arkenv from "@arkenv/nuxt/standard";
```

```ts
export default defineNuxtConfig({
  modules: ["@arkenv/nuxt/standard/module"],
});
```

**BREAKING CHANGE**: `@arkenv/nuxt/standard/config` has been removed. Use `@arkenv/nuxt/standard` and `@arkenv/nuxt/standard/module`.
