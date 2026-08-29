# ArkEnv + Next.js (Standard Schema / Zod) Example

This example demonstrates how to use [@arkenv/nextjs](https://arkenv.js.org/docs/nextjs) in Standard Mode using [@arkenv/standard](https://arkenv.js.org/docs/reference/standard) and [Zod](https://zod.dev/) with Next.js (App Router). It showcases:

- **Environment variable validation** with Zod via Standard Schema without `arktype` or `@arkenv/core`.
- **Strict Server/Client boundary validation**: Server-only variables (like `DATABASE_URL`) are automatically blocked and throw a clear runtime error if accessed on the client-side.
- **Typesafe environment variables** in both React Server Components (RSC) and Client Components.

## Setup

The example defines the environment schema in `env.ts` with Zod:

```ts title="env.ts"
import arkenv from "@/.arkenv";
import * as z from "zod";

export const env = arkenv({
  DATABASE_URL: z.string().default("postgres://localhost:5432/mydb"),
  NEXT_PUBLIC_API_URL: z.string().default("https://api.example.com"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});
```

And configures Next.js with `withArkEnv` from `@arkenv/nextjs/standard/config`:

```ts title="next.config.ts"
import { withArkEnv } from "@arkenv/nextjs/standard/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withArkEnv(nextConfig);
```

### Key Configurations:

1. **Server Schema**: Variables that are only accessible on the server.
2. **Client Schema**: Variables that are exposed to the client (must begin with `NEXT_PUBLIC_` to match Next.js conventions).
3. **Shared Schema**: Common variables like `NODE_ENV`.
4. **Automatic Codegen**: ArkEnv automatically parses the keys and generates `.arkenv/env.gen.ts` importing from `@arkenv/nextjs/standard` via the `withArkEnv` wrapper in `next.config.ts`. Import it as `@/.arkenv`.

## Usage in Components

### React Server Components (RSC)

You can safely access all server, client, and shared variables:

```tsx title="app/page.tsx"
import { env } from "../env";

export default function Page() {
  const dbUrl = env.DATABASE_URL; // ✅ Allowed
  const api = env.NEXT_PUBLIC_API_URL; // ✅ Allowed
  return <div>...</div>;
}
```

### Client Components

You can access client and shared variables. Reading a server-only key throws a native `Error`:

```txt
Error: Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)
```

```tsx title="app/components/connection-status.tsx"
"use client";

import { env } from "@/env";

export function ConnectionStatus() {
  return <p>Connected to {env.DATABASE_URL}</p>; // throws on the client
}
```

## Running the Example

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Documentation

For more information, see the [@arkenv/nextjs documentation](https://arkenv.js.org/docs/nextjs).
