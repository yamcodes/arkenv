---
"@arkenv/nuxt": patch
---

#### Migrate Nuxt schema capture to isolated Symbol state

Schema capture in `@arkenv/nuxt` now lives on `Symbol.for("arkenv.nuxt.schemaCapture.v1")` instead of the legacy string key `__ARKENV_SCHEMA_CAPTURE__`. This isolates Nuxt's schema capture lifecycle from process-level collisions with other capture workflows.
