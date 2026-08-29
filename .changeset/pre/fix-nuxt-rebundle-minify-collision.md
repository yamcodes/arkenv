---
"@arkenv/nuxt": patch
"@arkenv/core": patch
---

Fix Nuxt (and Core) client rebundles failing with `Identifier "h" has already been declared` by shipping unminified `@repo/utils` / `@arkenv/nuxt` ESM that alwaysBundle multi-entry utils chunks.
