# @arkenv/nextjs

ArkEnv integration for Next.js. Provides a typesafe, zero-dependency (except peer dependencies) environment variable parser and validator for Next.js applications, with automatic code generation to eliminate manual `runtimeEnv` boilerplate.

## Installation

```bash
pnpm add @arkenv/nextjs @arkenv/core arktype
```

For Zod, Valibot, or other Standard Schema validators **without** ArkType, install `@arkenv/standard` instead of `@arkenv/core`/`arktype`, and use `@arkenv/nextjs/standard` (and `@arkenv/nextjs/standard/config` for `withArkEnv`). See the [Standard Schema docs](https://arkenv.js.org/docs/core-concepts/standard-schema).

## Setup & Codegen

Next.js requires client-side environment variables to be statically destructured (`process.env.NEXT_PUBLIC_...`) to allow static inlining during bundling.

To automate this, `@arkenv/nextjs/config` provides `withArkEnv`, which statically extracts your keys and writes a tailored factory in `.arkenv/env.gen.ts`. Import that factory as `@/.arkenv`. The wrapper registers Turbopack and Webpack aliases so you never import from the dot-folder directly.

Add `.arkenv/` to `.gitignore`. `withArkEnv` regenerates the factory when Next.js loads your config (dev and build). `arkenv init` also writes the factory once and maps `@/.arkenv` in `tsconfig.json` so `tsc --noEmit` works after install.

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

Function-form configs (sync or async) are supported:

```typescript
export default withArkEnv(async (phase, { defaultConfig }) => ({
  ...defaultConfig,
  reactStrictMode: phase !== "phase-test",
}));
```

### 2. Define your schema in `env.ts`

Import `arkenv` from `@/.arkenv` instead of the package:

```typescript
// src/env.ts
import arkenv from "@/.arkenv";

export const env = arkenv({
  DATABASE_URL: "string",
  NEXT_PUBLIC_API_URL: "string.host",
  NODE_ENV: "string",
});
```

---

## Customizing Paths

If you need a different on-disk location, pass `outputPath`. Keep importing `@/.arkenv`. `withArkEnv` aliases the specifier for Next.js; codegen writes `.arkenv/index.ts` so `tsc --noEmit` follows the same import.

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
