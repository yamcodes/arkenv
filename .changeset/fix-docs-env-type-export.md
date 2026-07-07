---
"arkenv": patch
---

#### Export `RuntimeEnvironment` type and define it directly with built-in types

Define `RuntimeEnvironment` directly using built-in `Record<string, string | undefined>` rather than depending on internal monorepo type aliases, and export it as part of the public API surface. This allows the documentation generator to resolve the type correctly without falling back to `any`.
