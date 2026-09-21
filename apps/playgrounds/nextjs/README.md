# ArkEnv + Next.js Example

This example demonstrates how to use [@arkenv/nextjs](https://arkenv.js.org/docs/nextjs) with Next.js (App Router). It showcases:

- **Environment variable validation** with ArkEnv.
- **Strict Server/Client boundary validation**: Server-only variables (like `DATABASE_URL`) are automatically blocked and throw a clear runtime error if accessed on the client-side.
- **Typesafe environment variables** in both React Server Components (RSC) and Client Components.

## Setup

The example defines the environment schema in a single `env.ts` file:

```ts title="env.ts"
import arkenv from "@/.arkenv";

export const env = arkenv({
  DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
  NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
```

### Key configurations

1. **Server keys**: Variables without a `NEXT_PUBLIC_` prefix stay
   server-only.
2. **Client keys**: Variables prefixed with `NEXT_PUBLIC_` are exposed
   to the client (Next.js convention). Use `exposeToClient` for
   non-prefixed keys you need on the client.
3. **Automatic codegen**: ArkEnv parses the keys and generates
   `.arkenv/env.gen.ts` via the `withArkEnv` wrapper in
   `next.config.ts`. Import it as `@/.arkenv`.

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

You can access client and shared variables. Reading a server-only key throws a native `Error` that is **not** an `ArkEnvError` instance:

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

Run `pnpm dev`, open **Billing**, and read the overlay. Do not catch this throw; move the read to a Server Component.

## Running the Example

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

## Documentation

For more information, see the [@arkenv/nextjs documentation](https://arkenv.js.org/docs/nextjs).
