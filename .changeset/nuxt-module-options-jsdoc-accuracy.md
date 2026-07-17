---
"@arkenv/nuxt": patch
---

#### Clarify auto-detected `schemaPath` and `layout` in `ModuleOptions` docs

Reword the `ModuleOptions` JSDoc to accurately describe auto-detection and drop the misleading `@default` tags: `schemaPath` is auto-discovered via `findSchemaPath`, and `layout` is auto-detected from the schema structure (`"strict"` when the split files are present, `"flat"` as the fallback) rather than defaulting to a fixed value.
