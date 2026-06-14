---
"arkenv": minor
"@arkenv/nextjs": minor
"@arkenv/vite-plugin": minor
"@arkenv/bun-plugin": minor
---

#### Rename `createEnv` function to `arkenv`

**BREAKING CHANGE**: Rename the primary environment variable validation function from `createEnv` to `arkenv` across all packages in the ecosystem, and expose it as both the default export and a named export.

Update all usages:

```ts
// Before
import { createEnv } from "arkenv";

export const env = createEnv({
  schema: {
    NODE_ENV: type("'development' | 'production' | 'test'"),
  },
});

// After
import arkenv from "arkenv";
// or: import { arkenv } from "arkenv";

export const env = arkenv({
  schema: {
    NODE_ENV: type("'development' | 'production' | 'test'"),
  },
});
```

Migration Steps:
- Replace all imports and invocations of `createEnv` with `arkenv`.
- Update config generators and plugins (Next.js config templates, Vite plugin, Bun plugin) to use `arkenv`.
