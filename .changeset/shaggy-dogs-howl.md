---
"@arkenv/cli": patch
---

#### Improve CLI feedback for Vite config and type definitions

- Only log "Updated vite.config.ts" if the file was actually modified.
- Clarify the type definition append step and provide feedback if the update was skipped.
