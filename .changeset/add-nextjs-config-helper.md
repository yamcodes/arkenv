---
"@arkenv/nextjs": minor
---

#### Add `withArkEnv` configuration wrapper for automatic Next.js `runtimeEnv` code generation

Introduce `withArkEnv` configuration wrapper in `@arkenv/nextjs/config`. It programmatically scans the environment variable schemas from your configuration file (e.g., `env.config.ts`) and automatically generates the compiled `env.ts` on disk. This removes the need to manually destructure and maintain duplicate variables in `runtimeEnv` to satisfy Next.js's static analysis requirements.

Usage in `next.config.ts` or `next.config.js`:

```ts
import type { NextConfig } from "next";
import { withArkEnv } from "@arkenv/nextjs/config";

const nextConfig: NextConfig = {};

export default withArkEnv(nextConfig);
```
