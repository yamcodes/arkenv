---
"@arkenv/cli": minor
---

#### Add Next.js support to ArkEnv CLI

The CLI now fully supports initializing ArkEnv in Next.js projects.

Features:
- **Framework Detection:** Automatically detects Next.js projects via `package.json` dependencies or config files (`next.config.ts`, `next.config.js`, etc.).
- **Interactive Scaffolding:** Configures framework settings, skips redundant type definition scaffolding, and defaults validator to `arktype` (required by `@arkenv/nextjs`).
- **Dynamic Scaffolding Template:** Dynamically splits detected variables into `server`, `client`, and `shared` fields, mapping browser/shared variables in the `runtimeEnv` block to prevent server secrets from leaking.
