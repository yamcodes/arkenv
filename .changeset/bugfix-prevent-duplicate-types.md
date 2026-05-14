---
"@arkenv/cli": patch
---

#### Prevent duplicate ArkEnv type injections in `env.d.ts`

Fixed an issue where the CLI would append ArkEnv type definitions multiple times if the `// @arkenv-types` marker was missing but the types were already present. The CLI now detects existing `ImportMetaEnvAugmented` (Vite) and `ProcessEnvAugmented` (Bun) definitions to avoid duplication.
