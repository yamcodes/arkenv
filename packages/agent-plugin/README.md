# @arkenv/agent-plugin

Coding-agent plugin and MCP server for ArkEnv. It teaches assistants to use
`import { env } from "./env"` and actively flags raw `process.env` /
`import.meta.env` access, client-side secret leaks, public-prefix mistakes,
and leftover v0 ambient `.d.ts` augmentations.

## Install the plugin

```bash
npx plugins add arkenv/arkenv-plugin
```

Compatible agent runtimes expose `/arkenv:init` and `/arkenv:audit`.

Until that GitHub shorthand is published, install from this monorepo:

```bash
npx plugins add yamcodes/arkenv
```

The plugin lives in `packages/agent-plugin` (discovered by a two-level scan).

## MCP server

```bash
npx -y @arkenv/agent-plugin
```

Stdio MCP tools:

- **`init`** — runs `arkenv init --agent` in `cwd`
- **`audit`** — AST scan; returns `{ diagnostics: [{ file, line, character, severity, ruleId, message, suggestedFix }] }`

## Programmatic audit

```ts
import { auditProject } from "@arkenv/agent-plugin";

const { diagnostics } = await auditProject(process.cwd());
```
