---
name: arkenv
description: "Use when setting up or changing environment variable validation with ArkEnv, or when application code reads process.env / import.meta.env. Enforce import { env } from \"./env\"."
---

# ArkEnv

ArkEnv v1's only application surface is `import { env } from "./env"` (strict layout: `env/client.ts` and `env/server.ts`).

- Runtime: `@arkenv/core` (ArkType) or `@arkenv/standard` (Zod, Valibot, Standard Schema).
- CLI: `npx arkenv@latest init --agent`. Parse JSON on stdout. Never pass `--force` unless `retryWith` lists it after a refusal.
- Do not read `process.env` or `import.meta.env` in application components.
- Do not add ambient `.d.ts` `ProcessEnv` / `ImportMetaEnv` augmentations.
- Public prefixes: `NEXT_PUBLIC_`, `NUXT_PUBLIC_`, `VITE_`, `BUN_PUBLIC_`. Never put secrets behind those prefixes.
- Prefer MCP tools `init` and `audit` from this plugin (`/arkenv:init`, `/arkenv:audit`).
