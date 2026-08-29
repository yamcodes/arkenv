---
"@arkenv/nuxt": patch
---

#### Type the `arkenv` key in `nuxt.config.ts` via `@nuxt/schema` augmentation

Augment `@nuxt/schema`'s `NuxtConfig` and `NuxtOptions` so the `arkenv` module options key is fully typed. Consumers now get autocomplete, type-checking, and JSDoc hovers for `arkenv` options directly in `nuxt.config.ts`, instead of falling back to a loose index signature.

`ModuleOptions` is now an alias of the documented `ArkEnvConfigOptions`, so option hovers surface the existing JSDoc / `@default` tags from a single source of truth.

```ts
export default defineNuxtConfig({
  modules: ["@arkenv/nuxt/module"],
  arkenv: {
    schemaPath: "src/env.ts", // autocompleted & type-checked
    layout: "flat",
    validate: true,
  },
});
```
