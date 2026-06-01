---
"@arkenv/nextjs": patch
---

#### Remove `@deprecated` JSDoc tag from `createEnv` and `arkenv` in the main and react-server entries

Avoid warning users when they call `createEnv` manually without using the codegen workflow.
