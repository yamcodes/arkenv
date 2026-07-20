# ArkEnv + SolidStart Example

This example demonstrates `@arkenv/vite-plugin` **transform mode** with [SolidStart](https://start.solidjs.com):

- A single `src/env.ts` is the typed source of truth (`import { env } from "./env"`)
- **Client graph**: plugin inlines coerced `VITE_*` literals and guards server-only keys
- **SSR graph**: `env.ts` runs as-is → boot-time validation against the real environment
- Reading `env.DATABASE_URL` in the browser throws (trust-the-proxy)

SPA mode (`arkenv(schema)` + `ImportMetaEnvAugmented` for `import.meta.env`) remains supported for client-only apps — see the [Vite plugin docs](https://arkenv.js.org/docs/vite-plugin).

## Setup

```ts title="src/env.ts"
import arkenv from "@arkenv/core";

export const env = arkenv({
  DATABASE_URL: "string = 'postgres://localhost:5432/solidstart'",
  VITE_TEST: "string = 'Hello from SolidStart'",
  VITE_NUMERIC: "string.numeric = '42'",
  VITE_BOOLEAN: "boolean = true",
});
```

```ts title="app.config.ts"
import arkenvVitePlugin from "@arkenv/vite-plugin";
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  vite: {
    plugins: [arkenvVitePlugin()],
  },
});
```

## Usage

```tsx
import { env } from "./env";

env.VITE_TEST; // string (inlined on the client)
env.DATABASE_URL; // throws in the browser; works on the server
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

- [Vite plugin docs](https://arkenv.js.org/docs/vite-plugin)
- [Typing import.meta.env (SPA mode)](https://arkenv.js.org/docs/vite-plugin/typing-import-meta-env)

## this project was created with the [Solid CLI](https://github.com/solidjs-community/solid-cli)
