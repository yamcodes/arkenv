---
"@arkenv/cli": patch
---

#### Add Next.js support to ArkEnv CLI

The CLI now fully supports initializing ArkEnv in Next.js projects.

- Automatically detect Next.js projects via `package.json` dependencies or config files (`next.config.ts`, `next.config.js`, etc.).
- Configure framework settings, skip redundant type definition scaffolding, and default validator to `arktype` (required by `@arkenv/nextjs`).
- Dynamically split detected variables into `server`, `client`, and `shared` fields, mapping browser/shared variables in the `runtimeEnv` block to prevent server secrets from leaking.
