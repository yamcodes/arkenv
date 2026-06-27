---
"@arkenv/nextjs": patch
"@arkenv/cli": patch
---

#### Add `codegen: false` option to `@arkenv/nextjs/config`

Add a `codegen` option to `withArkEnv` and `setupArkEnv` that disables automatic `env.gen.ts` generation while keeping build-time environment validation active.

Usage:

```ts title="next.config.ts"
import { withArkEnv } from "@arkenv/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};
export default withArkEnv(nextConfig, { codegen: false });
```

When `codegen` is `false`, provide a manual `runtimeEnv` mapping in your schema file. The CLI's `--no-codegen` flag now also skips generating `env.gen.ts` during scaffolding while still wrapping `next.config.ts` with `withArkEnv(nextConfig, { codegen: false })`.
