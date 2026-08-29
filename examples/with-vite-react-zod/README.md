# ArkEnv + Vite (Standard Schema / Zod) Example

This example demonstrates how to use [@arkenv/vite-plugin](https://arkenv.js.org/docs/vite-plugin) in Standard Mode with [@arkenv/standard](https://arkenv.js.org/docs/reference/standard), [Zod](https://zod.dev/), Vite, and React. It showcases:

- **Environment variable validation** with Zod via Standard Schema without `arktype` or `@arkenv/core`.
- **Typesafe `env` object** imported directly from `./src/env.ts`.
- **Client-side environment variables** with automatic filtering of `VITE_*` prefixed variables.

## Setup

Define your environment schema with Zod in `src/env.ts`:

```ts title="src/env.ts"
import arkenv from "@arkenv/standard";
import * as z from "zod";

export const env = arkenv({
  PORT: z.number().default(3000),
  VITE_MY_VAR: z.string().default("hello"),
  VITE_MY_NUMBER: z.number().default(42),
  VITE_MY_BOOLEAN: z.boolean().default(true),
});

export default env;
```

And add the plugin in `vite.config.ts`:

```ts title="vite.config.ts"
import arkenvVitePlugin from "@arkenv/vite-plugin/standard";
import reactPlugin from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactPlugin(), arkenvVitePlugin()],
  resolve: {
    tsconfigPaths: true,
  },
});
```

## Running the Example

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Documentation

For more information, see the [@arkenv/vite-plugin documentation](https://arkenv.js.org/docs/vite-plugin).
