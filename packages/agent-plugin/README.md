# @arkenv/agent-plugin

Coding-agent plugin and MCP server for ArkEnv. It teaches assistants to use
`import { env } from "./env"` and actively flags raw `process.env` /
`import.meta.env` access, client-side secret leaks, public-prefix mistakes,
and leftover v0 ambient `.d.ts` augmentations.

POC: the MCP server also ships a **Live Preview** [MCP App](https://modelcontextprotocol.io/extensions/apps/overview)
(`preview` tool + `ui://arkenv/live-preview.html`) — an env health board for
schema keys, `.env.example` presence, and redacted check failures.

## Install the plugin

The monorepo lists this package in `.claude-plugin/marketplace.json`, so the
plugins CLI installs `packages/agent-plugin` instead of treating the repo
root's `skills/` tree as a plugin:

```bash
npx plugins add yamcodes/arkenv
```

From a local clone:

```bash
npx plugins add ./packages/agent-plugin
```

Compatible agent runtimes expose `/arkenv:init` and `/arkenv:audit`.

## MCP server

After this package is published:

```bash
npx -y @arkenv/agent-plugin
```

From a local clone, build first and point MCP at the bin:

```bash
nub run --filter @arkenv/agent-plugin build
node ./packages/agent-plugin/bin.mjs
```

Stdio MCP tools:

- **`preview`** — Live Preview env health board (MCP App UI when the host supports Apps; JSON fallback otherwise)
- **`init`** — runs `arkenv init --agent` in `cwd`
- **`audit`** — AST scan; returns `{ diagnostics: [{ file, line, character, severity, ruleId, message, suggestedFix }] }`

### Cursor MCP config (local)

```json
{
  "mcpServers": {
    "arkenv": {
      "command": "node",
      "args": ["./packages/agent-plugin/dist/bin.js"]
    }
  }
}
```

Then ask: “Show my ArkEnv Live Preview.”

## Programmatic audit

```ts
import { auditProject } from "@arkenv/agent-plugin";

const { diagnostics } = await auditProject(process.cwd());
```
