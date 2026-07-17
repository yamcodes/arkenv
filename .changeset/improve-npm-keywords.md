---
"@arkenv/core": patch
"@arkenv/standard": patch
"arkenv": patch
"@arkenv/vite-plugin": patch
"@arkenv/bun-plugin": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
"@arkenv/fumadocs-ui": patch
---

#### Improve npm keywords across published packages for discoverability

Clean up and extend the `keywords` field of every published package so npm search, aggregators, and LLM-powered package discovery surface ArkEnv for the terms users actually search for.

- Remove the misleading `pnpm` keyword from `@arkenv/core` and `@arkenv/standard`, and give every env-related package a shared baseline (`env`, `environment-variables`, `dotenv`, `config`, `validation`, `typesafe`, `standard-schema`) alongside their integration-specific terms.
- Keep validator-specific terms where they belong: `arktype` on `@arkenv/core`, and `zod` + `valibot` on `@arkenv/standard`.
- Deduplicate the repeated `arkenv` keyword in `@arkenv/vite-plugin`.
- Extend the `arkenv` CLI keywords with `create`, `generator`, `env`, `environment-variables`, and `config`.
- Add a keyword set to `@arkenv/fumadocs-ui`, which previously had none.
