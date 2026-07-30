---
"@arkenv/nuxt": patch
---

#### Document `ModuleOptions` with JSDoc for better editor DX

Add descriptions and `@default` tags to the `ModuleOptions` type so hovering `schemaPath`, `layout`, `validate`, `logger`, and `logLevel` in `nuxt.config.ts` surfaces inline documentation.

```ts title="nuxt.config.ts"
export default defineNuxtConfig({
  modules: ["@arkenv/nuxt/module"],
  arkenv: {
    // Hovering these keys now shows their description and default value
    schemaPath: "src/env.ts",
    layout: "flat",
    validate: true,
  },
});
```
