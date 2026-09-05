# ArkEnv + TanStack Start (Rsbuild) Example

This example demonstrates `@arkenv/rsbuild-plugin` with [TanStack Start](https://tanstack.com/start) on Rsbuild:

- A single `src/env.ts` is the typed source of truth (`import { env } from "./env"`)
- **Client graph**: plugin inlines coerced `PUBLIC_*` literals and guards server-only keys
- **SSR graph**: `env.ts` runs as-is → boot-time validation against the real environment, including inside `createServerFn` handlers
- Reading `env.DATABASE_URL` in the browser throws (try the button on the home page)

## Setup

```ts title="src/env.ts"
import arkenv from "@arkenv/core";

export const env = arkenv({
  DATABASE_URL: "string = 'postgres://localhost:5432/tanstackstartrsbuild'",
  PORT: "number.port = 3000",
  PUBLIC_API_URL: "string = 'https://api.example.com'",
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
```

```ts title="rsbuild.config.ts"
import { pluginReact } from "@rsbuild/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/rsbuild";
import { arkenvRsbuildPlugin } from "@arkenv/rsbuild-plugin";
import { defineConfig } from "@rsbuild/core";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tanstackStart({ srcDirectory: "src" }),
    pluginReact(),
    arkenvRsbuildPlugin(),
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

env.PUBLIC_API_URL; // string (inlined on the client)
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

- [TanStack Start guide](https://github.com/yamcodes/arkenv/blob/v1/apps/www/content/docs/frameworks/tanstack-start.mdx) (`/docs/frameworks/tanstack-start` on the v1 docs site)
- [Rsbuild plugin docs](https://arkenv.js.org/docs/reference/rsbuild-plugin)
