---
"@arkenv/cli": patch
---

#### Improve CLI feedback for Vite config and type definitions

- Fix #988: Only log "Updated vite.config.ts" if the file was actually modified.
- Fix #989: Clarify the type definition append step and provide feedback if the update was skipped.
