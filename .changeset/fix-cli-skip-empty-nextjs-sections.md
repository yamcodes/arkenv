---
"@arkenv/cli": patch
---

#### Fix empty sections in Next.js scaffolded schema

The CLI no longer emits empty `server: {}`, `client: {}`, or `shared: {}` blocks when no variables belong to that section. Previously, scaffolding a project with no `NEXT_PUBLIC_*` variables produced `client: {}`, which caused a TypeScript error:

```
Type '{}' is missing the following properties from type '{ PORT: never; NODE_ENV: never; }': PORT, NODE_ENV
```

`server`, `client`, and `shared` sections are now conditionally omitted when empty. `runtimeEnv` is always emitted as it is required by `@arkenv/nextjs`. This applies across all three validator templates (ArkType, Zod, Valibot).
