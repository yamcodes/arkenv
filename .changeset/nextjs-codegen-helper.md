---
"@arkenv/nextjs": patch
---

#### Add `withArkEnv` configuration helper for Next.js

Add a Next.js configuration wrapper in `@arkenv/nextjs/config` that automates client-side and shared environment variable destructuring in the `runtimeEnv` block:

```typescript
// next.config.ts
import { withArkEnv } from "@arkenv/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
};

export default withArkEnv(nextConfig);
```

Key features:
- **Zero-Boilerplate Destructuring**: Statically extract `client` and `shared` keys from your `env.ts` schema and generate a tailored `createEnv` factory in `env.gen.ts` that pre-fills the `runtimeEnv` block.
- **Development Watcher**: Automatically start a lightweight file watcher in development mode to regenerate `env.gen.ts` on the fly when `env.ts` changes.
- **Customizable Output**: Support custom schema and output paths, enabling developers to write generated files to a dedicated folder (e.g., `src/generated/env.gen.ts`).
- **Deprecate Direct Exports**: Mark direct `createEnv` and default `arkenv` exports from the main and `react-server` entry points as deprecated to steer developers toward the new codegen workflow.


Example usage in `env.ts`:

```typescript
// env.ts
import { createEnv } from "./env.gen";

export const env = createEnv({
	client: {
		NEXT_PUBLIC_API_URL: "string",
	},
	shared: {
		NODE_ENV: "string",
	},
});
```
