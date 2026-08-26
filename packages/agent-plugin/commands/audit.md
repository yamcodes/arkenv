---
description: Audit the repo for unvalidated env access and secret leaks.
---

Run an ArkEnv security audit of the current project.

1. Prefer the MCP `audit` tool with `cwd` set to the project root. If MCP is unavailable, still prefer calling `audit` via MCP once the server is running (`npx -y @arkenv/agent-plugin`) rather than grepping.
2. Treat each diagnostic as actionable: `file`, `line`, `character`, `severity`, `ruleId`, `message`, `suggestedFix`.
3. Fix `unvalidated-access` by routing reads through `import { env } from "./env"`.
4. Fix `secret-leak` by moving server keys off `"use client"` modules and client file trees.
5. Fix `prefix-violation` by removing public prefixes (`NEXT_PUBLIC_`, `NUXT_PUBLIC_`, `VITE_`, `BUN_PUBLIC_`) from secret names.
6. Fix `legacy-ambient` by deleting v0 `ProcessEnv` / `ImportMetaEnv` augmentations.

Do not flag valid `import { env } from "./env"` usage. Do not rewrite the canonical env module's own schema definition into raw `process.env` reads.
