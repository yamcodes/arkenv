---
"@arkenv/bun-plugin": patch
---

#### Use engine-specific schema examples in hybrid missing-schema errors

Point Standard Mode (`@arkenv/bun-plugin/standard`) error examples at `@arkenv/standard` instead of `@arkenv/core`, so missing-schema guidance matches the active engine.
