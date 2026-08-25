---
"@arkenv/agent-plugin": minor
---

#### Add a coding-agent plugin with MCP `init` and `audit` tools

Ship `@arkenv/agent-plugin` so coding agents can install ArkEnv expertise via
`npx plugins add arkenv/arkenv-plugin`. The package exposes `/arkenv:init`
(delegates to `arkenv init --agent`) and `/arkenv:audit` (TypeScript AST scan
for raw `process.env` / `import.meta.env` access, client secret leaks, public
prefix mistakes, and leftover v0 ambient `.d.ts` augmentations).

Connect the stdio MCP server:

```bash
npx -y @arkenv/agent-plugin
```

Audit a tree programmatically:

```ts
import { auditProject } from "@arkenv/agent-plugin";

const { diagnostics } = await auditProject(".");
```
