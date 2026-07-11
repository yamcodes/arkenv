---
"@arkenv/build": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
---

#### Standardize warning and error log prefix formatting

Introduce a shared `log.ts` utility module in `@arkenv/build` with unified prefix constants and helper functions (`logBuildWarning`, `logBuildError`, `formatBuildError`, `logWatcherError`). Update `@arkenv/nextjs` and `@arkenv/nuxt` to use these helpers instead of manually-prefixed string literals, eliminating casing inconsistencies and code duplication.
