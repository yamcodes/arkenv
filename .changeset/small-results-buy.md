---
"@arkenv/cli": patch
---

#### Add Next.js support to ArkEnv CLI

ArkEnv CLI now fully supports initializing ArkEnv in Next.js projects.

- Automatically detect Next.js projects via `package.json` dependencies or config files (`next.config.ts`, `next.config.js`, etc.).
- Configure framework settings, skip redundant type definition scaffolding, and install `@arkenv/nextjs` along with `arktype` (which is required by the integration, even when selecting a different validator like Zod or Valibot).
- Dynamically split detected variables into `server`, `client`, and `shared` fields based on the selected validator (ArkType, Zod, or Valibot), mapping browser/shared variables in the `runtimeEnv` block to prevent server secrets from leaking.
