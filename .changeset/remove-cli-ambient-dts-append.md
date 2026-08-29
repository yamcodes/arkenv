---
"arkenv": patch
---

#### Remove ambient `.d.ts` append for Vite and Bun

Scaffolding for Vite and Bun projects now configures `env.ts` directly without creating or modifying ambient type definition files (`vite-env.d.ts` / `bun-env.d.ts`). All framework templates use standard schema imports.

Usage:

```ts
import { env } from "./src/env";

console.log(env.PORT);
```
