# @arkenv/nextjs

ArkEnv integration for Next.js. Provides a typesafe, zero-dependency (except peer dependencies) environment variable parser and validator for Next.js applications, with automatic code generation to eliminate manual `runtimeEnv` boilerplate.

## Installation

```bash
pnpm add @arkenv/nextjs arktype
```

## Setup & Codegen

Next.js requires client-side environment variables to be statically destructured (`process.env.NEXT_PUBLIC_...`) to allow static inlining during bundling.

To automate this, `@arkenv/nextjs/config` provides `withArkEnv`, which statically extracts your keys and writes a tailored factory in `generated/env.gen.ts`.

### 1. Configure `next.config.ts`

Wrap your Next.js configuration in `withArkEnv`:

```typescript
// next.config.ts
import { withArkEnv } from "@arkenv/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Your standard Next.js config options
};

export default withArkEnv(nextConfig);
```

### 2. Define your schema in `env.ts`

Import `arkenv` from the generated `./generated/env.gen` file instead of the package:

```typescript
// src/env.ts
import arkenv from "./generated/env.gen";

export const env = arkenv({
  server: {
    DATABASE_URL: "string",
    STRIPE_API_KEY: "string",
  },
  client: {
    NEXT_PUBLIC_API_URL: "string.host",
  },
  shared: {
    NODE_ENV: "string",
  },
});
```

*Note: For the best DX and CI/CD compatibility, we recommend committing `generated/env.gen.ts` to source control.*

---

## Customizing Paths

If you want to keep generated files in a separate subdirectory (like `src/generated/`), you can specify the `schemaPath` and `outputPath` options in `next.config.ts`:

```typescript
// next.config.ts
import { withArkEnv } from "@arkenv/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withArkEnv(nextConfig, {
  schemaPath: "src/env.ts",
  outputPath: "src/generated/env.gen.ts"
});
```

Then, import from the custom location:

```typescript
// src/env.ts
import arkenv from "./generated/env.gen";

export const env = arkenv({
  client: {
    NEXT_PUBLIC_API_URL: "string",
  }
});
```
