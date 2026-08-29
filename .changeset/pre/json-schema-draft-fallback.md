---
"@arkenv/standard": patch
---

#### Retry Standard JSON Schema `draft-2020-12` and surface converter failures

On-value Standard JSON Schema converters are now probed with `draft-07`, then `draft-2020-12`. Validators that only implement `draft-2020-12` participate in ArkEnv pre-coercion — for example Joi, which can now use root `@arkenv/standard` with the same pre-coercion pipeline as Zod. When a converter is present but every target fails — throws or returns a non-schema — the key fails with `INVALID_SCHEMA` and the underlying message instead of looking like missing JSON Schema support or falling through to `toJsonSchema`.
