---
"@arkenv/core": patch
"@arkenv/standard": patch
---

#### Avoid Node-only `process` APIs in color detection

ANSI color helpers no longer read `process.versions` or `process.stdout` as static member expressions, so Next.js edge instrumentation no longer flags `@arkenv/core` when `env` is imported from edge files.
