---
"@arkenv/agent-plugin": patch
---

#### Load the audit parser from the TypeScript 6 package

The agent plugin audit now depends on `@typescript/typescript6` instead of the `typescript` package, so source parsing still works when `typescript` stops exporting the compiler API.
