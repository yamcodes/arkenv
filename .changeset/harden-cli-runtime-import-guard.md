---
"arkenv": patch
---

#### Harden runtime import guard for native ESM and CommonJS

Separate the CLI binary executable (`src/bin.ts`) from the package root export (`src/index.ts`) so that importing or requiring `arkenv` as a library unconditionally throws a descriptive migration error guiding users to `@arkenv/core` in both ESM and CommonJS module systems.
