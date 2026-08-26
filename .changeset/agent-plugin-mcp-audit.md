---
"@arkenv/agent-plugin": patch
---

#### Add a coding-agent plugin with MCP `init` and `audit` tools

`@arkenv/agent-plugin` is now available for coding agents. Install it with
`npx plugins add yamcodes/arkenv`. Compatible runtimes expose `/arkenv:init`
(delegates to `arkenv init --agent`) and `/arkenv:audit` (TypeScript AST scan
for raw `process.env` / `import.meta.env` access, client secret leaks, public
prefix mistakes, and leftover v0 ambient `.d.ts` augmentations).

The stdio MCP server is available after publish:

```bash
npx -y @arkenv/agent-plugin@alpha
```

Audit a tree programmatically:

```ts
import { auditProject } from "@arkenv/agent-plugin";

const { diagnostics } = await auditProject(".");
```
