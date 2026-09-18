---
"@arkenv/agent-plugin": minor
---

#### Add Live Preview MCP App (POC)

`@arkenv/agent-plugin` now exposes a `preview` MCP tool backed by a SEP-1865 MCP App View (`ui://arkenv/live-preview.html`). The board shows schema keys, `.env.example` presence, and redacted `arkenv check` failure reasons, with JSON fallback for hosts without Apps UI. The MCP server moves to `@modelcontextprotocol/server` v2 + `@modelcontextprotocol/ext-apps`.
