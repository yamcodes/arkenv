---
"@arkenv/agent-plugin": patch
---

#### Drop pre-release tags from MCP spawn args

`.mcp.json` now spawns `@arkenv/agent-plugin` without `@alpha` or `@rc`, so MCP clients resolve the package from the default npm tag.
