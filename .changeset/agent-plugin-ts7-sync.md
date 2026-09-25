---
"@arkenv/agent-plugin": patch
---

#### Parse audit sources with the TypeScript 7 sync API

The agent plugin audit now parses source files through `typescript/unstable/sync` instead of the classic TypeScript compiler API.
