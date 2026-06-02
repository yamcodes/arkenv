---
"@arkenv/cli": patch
---

#### Automatically wrap Next.js config with `withArkEnv` during `arkenv init`

- Added `transformNextjsConfig` AST transformer to wrap default exports with `withArkEnv` using magicast
- Added `findNextjsConfig` and `bootstrapNextjsConfig` utilities for Next.js config discovery and mutation
- Integrated Next.js config bootstrapping into the CLI executor during `arkenv init`
- Fixed next-steps suppression: manual `withArkEnv` instructions are now shown even when the AI skill is detected if auto-bootstrapping failed
