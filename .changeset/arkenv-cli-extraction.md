---
"arkenv": minor
"@arkenv/cli": minor
---

Extract CLI logic into a standalone `@arkenv/cli` package. This restores `arkenv` to a zero-dependency runtime library and allows the CLI to be invoked on-demand via `pnpm dlx @arkenv/cli@latest init`.
