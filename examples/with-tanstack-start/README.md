# ArkEnv + TanStack Start Example

This example demonstrates `@arkenv/vite-plugin` with [TanStack Start](https://tanstack.com/start) on native Vite:

- A single `src/env.ts` is the typed source of truth (`import { env } from "./env"`)
- **Client graph**: plugin inlines coerced `VITE_*` literals and guards server-only keys
- **SSR graph**: `env.ts` runs as-is → boot-time validation against the real environment, including inside `createServerFn` handlers
- Reading `env.DATABASE_URL` in the browser throws (try the button on the home page)

## Setup

```ts title="src/env.ts"
import arkenv from "@arkenv/core";

export const env = arkenv({
  DATABASE_URL: "string = 'postgres://localhost:5432/tanstackstart'",
  PORT: "number.port = 3000",
  VITE_API_URL: "string = 'https://api.example.com'",
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
```

```ts title="vite.config.ts"
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import arkenvVitePlugin from "@arkenv/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackStart({ srcDirectory: "src" }),
    // React's Vite plugin must come after Start's plugin
    viteReact(),
    arkenvVitePlugin(),
  ],
});
```

## Usage

```tsx
import { createServerFn } from "@tanstack/react-start";
import { env } from "./env";

const readDatabaseUrl = createServerFn({ method: "GET" }).handler(() => {
  return env.DATABASE_URL; // server-only: real value, validated at boot
});

env.VITE_API_URL; // string (inlined on the client)
env.DATABASE_URL; // throws in the browser; works in SSR and server functions
```

## Running the Example

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Documentation

- [TanStack Start guide](https://arkenv.js.org/docs/frameworks/tanstack-start)
- [Vite plugin docs](https://arkenv.js.org/docs/reference/vite-plugin)
