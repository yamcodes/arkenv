---
"arkenv": patch
---

#### Harden runtime import guard for native ESM and CommonJS

Separated the CLI binary executable (`src/bin.ts`) from the package root export (`src/index.ts`) so that importing or requiring `arkenv` as a library unconditionally throws a descriptive migration error guiding users to `@arkenv/core` (or `@arkenv/standard`) in both ESM and CommonJS module systems.

```ts
// Importing arkenv in ESM or requiring it in CJS throws immediately:
import "arkenv"; // 🚨 [ArkEnv] You imported the 'arkenv' package as a library. Starting with v1.0.0, the 'arkenv' package is exclusively the interactive CLI. If you want to validate environment variables in your code, please install and import '@arkenv/core' (or '@arkenv/standard') instead, or run `npx arkenv@latest init` to guide you through setup.
```
