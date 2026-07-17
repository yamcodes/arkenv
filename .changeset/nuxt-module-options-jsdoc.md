---
"@arkenv/nuxt": patch
---

#### Document `ModuleOptions` with JSDoc for better editor DX

Add JSDoc to the `ModuleOptions` type so hovering `schemaPath`, `layout`, and `validate` in `nuxt.config.ts` surfaces inline documentation. The docs describe auto-detection accurately: `schemaPath` is auto-discovered via `findSchemaPath`, and `layout` is auto-detected from the schema structure (`"strict"` when the split files are present, `"flat"` as the fallback).

```ts title="nuxt.config.ts"
export default defineNuxtConfig({
  modules: ["@arkenv/nuxt/module"],
  arkenv: {
    // Hovering these keys now shows their description
    schemaPath: "src/env.ts",
    layout: "flat",
    validate: true,
  },
});
```
