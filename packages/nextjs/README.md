# @arkenv/nextjs

ArkEnv integration for Next.js. Provides a typesafe, zero-dependency (except peer dependencies) environment variable parser and validator for Next.js applications, with automatic code generation to eliminate manual `runtimeEnv` boilerplate.

## Installation

```bash
pnpm add @arkenv/nextjs @arkenv/core arktype
```

For Zod, Valibot, or other Standard Schema validators **without** ArkType, install `@arkenv/standard` instead of `@arkenv/core`/`arktype`, and use `@arkenv/nextjs/standard` (and `@arkenv/nextjs/standard/config` for `withArkEnv`). See the [Standard Schema docs](https://arkenv.dev/docs/nextjs/using-other-validators).

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

---

## The Danger of Shared Variables

> [!WARNING]
> Restrict the `shared` block only to `NODE_ENV`. Avoid placing custom variables (like `PORT` or other custom configuration) in the `shared` block.

### The Undefined Fallback Bug

Next.js statically strips `process.env` references from client-side bundles unless they are prefixed with `NEXT_PUBLIC_`.
If you define a custom variable in `shared` with a default value (e.g., `PORT` defaulting to `3000` or `THEME` defaulting to `'dark'`), the environment behaves asymmetrically:

- On the **server**, ArkEnv reads the actual value from the environment (e.g. `PORT = 8080`).
- On the **client**, Next.js strips `process.env.PORT` to `undefined`, causing ArkEnv to fall back to the default value (`3000`).

This asymmetry causes React hydration mismatches and corrupts client-side state. Always place non-prefixed variables under `server` so they are strictly server-only.
