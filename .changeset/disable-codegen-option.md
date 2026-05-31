---
"@arkenv/cli": patch
---

#### Add `--no-codegen` CLI option and dedicated prompt for Next.js scaffolding

Introduce a `--no-codegen` (or `-C`) option and an interactive prompt to allow developers to opt out of the Next.js automatic environment variable code generation workflow. When opted out, the CLI scaffolds the project to use standard runtimeEnv destructuring and skips post-scaffold code generation bootstrapping.

Additionally, fix a TypeScript compilation check error in the CLI planner by adding the missing `parsed` property type to `CollectedState["tsConfig"]`.
