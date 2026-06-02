# ArkEnv + Next.js Strict Layout Example

This example demonstrates how to use [@arkenv/nextjs](https://arkenv.js.org/docs/nextjs) with Next.js (App Router) in a strict split 3-file layout. It showcases:

- **Environment variable validation** with ArkEnv.
- **Strict Server/Client boundary validation**: Server-only variables (like `DATABASE_URL`) are compile-time locked and cannot be bundled into client-side code.
- **Typesafe environment variables** in both React Server Components (RSC) and Client Components.

## Setup

The example defines the environment schema across three split files in the `env/` directory:

1. **Shared variables**: `env/internal/shared.ts`
   ```ts
   import { type } from "@arkenv/nextjs/shared";
   export const SharedSchema = type({
        NODE_ENV: "'development' | 'production' | 'test' = 'development'",
   });
   ```

2. **Client variables**: `env/client.ts`
   ```ts
    import arkenv from "./generated/env.gen";
    import { SharedSchema } from "./internal/shared";

    export const env = arkenv(
       {
           NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
       },
       {
           extends: [SharedSchema],
       },
   );
   ```

3. **Server variables**: `env/server.ts`
   ```ts
   import arkenv from "@arkenv/nextjs/server";
   import { env as clientEnv } from "./client";

   export const env = arkenv(
       {
           DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
       },
       {
           extends: [clientEnv],
       },
   );
   ```

### Configuration Wrapper

The Next.js configuration `next.config.ts` wraps the config object with `withArkEnv` from `@arkenv/nextjs/config`. This statically scans the split files in `env/` and automatically generates the `env/generated/env.gen.ts` file containing the pre-filled `runtimeEnv` block.

## Usage in Components

### React Server Components (RSC)

Import `env` from the server file:

```tsx title="app/page.tsx"
import { env } from "../env/server";

export default function Page() {
  const dbUrl = env.DATABASE_URL; // ✅ Allowed
  const api = env.NEXT_PUBLIC_API_URL; // ✅ Allowed
  return <div>...</div>;
}
```

### Client Components

Import `env` from the client file:

```tsx title="app/client-component.tsx"
"use client";

import { env } from "../env/client";

export default function ClientComponent() {
  const api = env.NEXT_PUBLIC_API_URL; // ✅ Allowed
  const dbUrl = env.DATABASE_URL; // ❌ Types check block and prevents bundling!
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
