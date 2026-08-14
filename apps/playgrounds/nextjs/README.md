# ArkEnv + Next.js Example

This example demonstrates how to use [@arkenv/nextjs](https://arkenv.js.org/docs/nextjs) with Next.js (App Router). It showcases:

- **Environment variable validation** with ArkEnv.
- **Strict Server/Client boundary validation**: Server-only variables (like `DATABASE_URL`) are automatically blocked and throw a clear runtime error if accessed on the client-side.
- **Typesafe environment variables** in both React Server Components (RSC) and Client Components.

## Setup

The example defines the environment schema in a single `env.ts` file:

```ts title="env.ts"
import arkenv from "@/generated/env.gen";

export const env = arkenv({
  server: {
    DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
  },
  client: {
    NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
  },
  shared: {
    NODE_ENV: "'development' | 'production' | 'test' = 'development'",
  },
});
```

### Key Configurations:

1. **Server Schema**: Variables that are only accessible on the server.
2. **Client Schema**: Variables that are exposed to the client (must begin with `NEXT_PUBLIC_` to match Next.js conventions).
3. **Shared Schema**: Common variables like `NODE_ENV`.
4. **Automatic Codegen**: ArkEnv automatically parses the keys and generates the `generated/env.gen.ts` file via the `withArkEnv` wrapper in `next.config.ts`, avoiding the need for a manual `runtimeEnv` block.

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

You can access client and shared variables. Reading a server-only key throws a native `Error` branded as `ArkEnvError` (so the stack matches validation) that is **not** an `ArkEnvError` instance:

```txt
ArkEnvError: Attempted to access server environment variable 'DATABASE_URL' on the client.
```

```tsx title="app/client-component.tsx"
"use client";

import { env } from "../env";

export default function ClientComponent() {
  const api = env.NEXT_PUBLIC_API_URL; // ✅ Allowed (string)
  const dbUrl = env.DATABASE_URL; // ❌ Throws on the client
  return <div>...</div>;
}
```

Run `pnpm dev`, open the app, and click **Try accessing DATABASE_URL (Secret)**. The panel inspects `error.name`, `error.constructor.name`, and `instanceof ArkEnvError`; the same throw is logged to the browser console.

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
