---
"arkenv": patch
---

#### Remove ambient `.d.ts` append and injection pipeline for Vite and Bun

Remove the dead `safeAppend` injection pipeline, templates (`ImportMetaEnvAugmented`, `ProcessEnvAugmented`), and unused scaffolding options (`envDtsHandling`, `installTypeDefinitions`). Scaffolding for Vite and Bun now exclusively configures `env.ts` and framework integrations without creating or appending ambient type definition files.
