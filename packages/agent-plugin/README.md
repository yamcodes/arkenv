# @arkenv/agent-plugin

Coding-agent plugin and MCP server for ArkEnv. It teaches assistants to use
`import { env } from "./env"` and actively flags raw `process.env` /
`import.meta.env` access, client-side secret leaks, public-prefix mistakes,
and leftover v0 ambient `.d.ts` augmentations.

## Install the plugin

The monorepo lists this package in the root `marketplace.json`, so the plugins
CLI installs `packages/agent-plugin` instead of treating the repo root's
`skills/` tree as a plugin:

```bash
npx plugins add yamcodes/arkenv
```

From a local clone:

```bash
npx plugins add ./packages/agent-plugin
```

Compatible agent runtimes expose `/arkenv:init` and `/arkenv:audit`.

## MCP server

After this package is published (alpha tag):

```bash
npx -y @arkenv/agent-plugin@alpha
```

From a local clone, build first and point MCP at the bin:

```bash
pnpm --filter @arkenv/agent-plugin build
node ./packages/agent-plugin/dist/bin.js
```

Stdio MCP tools:

- **`init`** — runs `arkenv init --agent` in `cwd`
- **`audit`** — AST scan; returns `{ diagnostics: [{ file, line, character, severity, ruleId, message, suggestedFix }] }`

## Programmatic audit

```ts
import { auditProject } from "@arkenv/agent-plugin";

const { diagnostics } = await auditProject(process.cwd());
```
