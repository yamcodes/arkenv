---
"arkenv": patch
"@arkenv/vite-plugin": patch
"@arkenv/bun-plugin": patch
"@arkenv/nextjs": patch
"@arkenv/nuxt": patch
"@arkenv/cli": patch
"@arkenv/fumadocs-ui": patch
---

#### Improve npm keywords across published packages for discoverability

Clean up and extend the `keywords` field of every published package so npm search, aggregators, and LLM-powered package discovery surface ArkEnv for the terms users actually search for.

- Remove the misleading `pnpm` keyword from `arkenv` and add `env`, `environment-variables`, `dotenv`, `config`, `standard-schema`, and the supported validators `zod` and `valibot`.
- Deduplicate the repeated `arkenv` keyword in `@arkenv/vite-plugin`.
- Give every env-related package a shared baseline (`env`, `environment-variables`, `dotenv`, `config`, `validation`, `typesafe`, `standard-schema`) alongside their integration-specific terms.
- Add a keyword set to `@arkenv/fumadocs-ui`, which previously had none.
