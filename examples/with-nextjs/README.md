# ArkEnv + Next.js Example

This example demonstrates how to use [@arkenv/nextjs](https://arkenv.js.org/docs/nextjs) with Next.js (App Router). It showcases:

- **Environment variable validation** with ArkEnv.
- **Strict Server/Client boundary validation**: Server-only variables (like `DATABASE_URL`) are automatically blocked and throw a clear runtime error if accessed on the client-side.
- **Typesafe environment variables** in both React Server Components (RSC) and Client Components.

## Setup

The example defines the environment schema in a single `env.ts` file:

```ts title="env.ts"
import arkenv from "@arkenv/nextjs";

export const env = arkenv({
	server: {
		DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
	},
	client: {
		NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
	},
	shared: {
		NODE_ENV: "string = 'development'",
	},
	runtimeEnv: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		NODE_ENV: process.env.NODE_ENV,
	},
});
```

### Key Configurations:

1. **Server Schema**: Variables that are only accessible on the server.
2. **Client Schema**: Variables that are exposed to the client (must begin with `NEXT_PUBLIC_` to match Next.js conventions).
3. **Shared Schema**: Common variables like `NODE_ENV`.
4. **Runtime Environment**: You must explicitly map client and shared variables in `runtimeEnv` so that Next.js client-side bundles can correctly inline them.

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

You can access client and shared variables, but accessing server variables will throw a runtime error:

```tsx title="app/client-component.tsx"
"use client";

import { env } from "../env";

export default function ClientComponent() {
  const api = env.NEXT_PUBLIC_API_URL; // ✅ Allowed (string)
  const dbUrl = env.DATABASE_URL; // ❌ Throws runtime error on client!
  return <div>...</div>;
}
```

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
