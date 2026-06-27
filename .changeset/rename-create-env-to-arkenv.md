---
"arkenv": major
"@arkenv/nextjs": major
---

#### Rename `createEnv` function to `arkenv`

**BREAKING CHANGE**: Rename the primary environment variable validation function from `createEnv` to `arkenv` across all packages in the ecosystem, and expose it as both the default export and a named export.

Update all usages:

```ts
// Before
import { createEnv } from "arkenv";

export const env = createEnv({
  NODE_ENV: "'development' | 'production' | 'test'",
});

// After
import arkenv from "arkenv";
// or: import { arkenv } from "arkenv";

export const env = arkenv({
  NODE_ENV: "'development' | 'production' | 'test'",
});
```

Migration Steps:
- Replace all imports and invocations of `createEnv` with `arkenv`.
- Update config generators and plugins (Next.js config templates, Vite plugin, Bun plugin) to use `arkenv`.
