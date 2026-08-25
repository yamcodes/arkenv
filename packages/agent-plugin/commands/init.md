---
description: Scaffold ArkEnv with the CLI in agent mode.
---

Scaffold ArkEnv in the current project.

1. Prefer the MCP `init` tool. If MCP is unavailable, run `npx arkenv@latest init --agent` in the project root.
2. Parse JSON on stdout. Success is `"status": "success"`.
3. On `"status": "error"`, branch on `code` and only retry with flags listed in `retryWith`. Never pass `--force` unless the user accepts that refusal.
4. Do not hand-write `env.ts`, `env/client.ts`, or framework config unless init fails.

After init, the only application surface is `import { env } from "./env"` (or `env/client.ts` / `env/server.ts` in strict layout). Do not read `process.env` or `import.meta.env` in application code. Do not add ambient `ProcessEnv` / `ImportMetaEnv` `.d.ts` augmentations.
