---
"@arkenv/agent-plugin": patch
---

#### Add a coding-agent plugin with MCP `init` and `audit` tools

Ship `@arkenv/agent-plugin` so coding agents can install ArkEnv expertise via
`npx plugins add yamcodes/arkenv` (the repo `marketplace.json` points at
`packages/agent-plugin`). The package exposes `/arkenv:init`
(delegates to `arkenv init --agent`) and `/arkenv:audit` (TypeScript AST scan
for raw `process.env` / `import.meta.env` access, client secret leaks, public
prefix mistakes, and leftover v0 ambient `.d.ts` augmentations).

Connect the stdio MCP server after publish:

```bash
npx -y @arkenv/agent-plugin@alpha
```

Audit a tree programmatically:

```ts
import { auditProject } from "@arkenv/agent-plugin";

const { diagnostics } = await auditProject(".");
```
