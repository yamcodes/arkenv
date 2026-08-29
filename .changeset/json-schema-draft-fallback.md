---
"@arkenv/standard": patch
"@arkenv/core": patch
---

#### Retry Standard JSON Schema `draft-2020-12` and surface converter failures

On-value Standard JSON Schema converters are now probed with `draft-07`, then `draft-2020-12`. Validators that only implement `draft-2020-12` participate in ArkEnv pre-coercion. When a converter is present but every target fails, the key fails with `INVALID_SCHEMA` and the underlying message instead of looking like missing JSON Schema support.
