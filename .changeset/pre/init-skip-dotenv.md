---
"arkenv": patch
---

#### Stop reading `.env` during `arkenv init`

`arkenv init` no longer opens `.env` files. Schema keys still come from
`.env.example` or from `process.env` / `import.meta.env` usage in source.
If `.env.example` is missing, init writes one from detected keys and
framework defaults instead of stripping values from `.env`.
