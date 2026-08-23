# ArkEnv + Vite (Standard Schema / Zod) Example

This example demonstrates how to use [@arkenv/vite-plugin](https://arkenv.js.org/docs/vite-plugin) in Standard Mode with [@arkenv/standard](https://arkenv.js.org/docs/reference/standard), [Zod](https://zod.dev/), Vite, and React. It showcases:

- **Environment variable validation** at build-time using Zod and Standard Schema without `arktype` or `@arkenv/core`.
- **Typesafe `import.meta.env`** with full TypeScript support.
- **Using environment variables in Vite config** (like `server.port`).
- **Client-side environment variables** with automatic filtering of `VITE_*` prefixed variables.

## Setup

The example uses a single schema definition with Zod that's reused for both server-side config variables and client-exposed variables:

```ts title="vite.config.ts"
import arkenv from "@arkenv/standard";
import arkenvVitePlugin from "@arkenv/vite-plugin/standard";
import reactPlugin from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { z } from "zod";

// Define the schema once
export const Env = {
  PORT: z.coerce.number().default(3000), // Server-only (used in vite.config)
  VITE_MY_VAR: z.string().default("Hello from ArkEnv with Zod"), // Client-exposed
  VITE_MY_NUMBER: z.coerce.number().default(42),
  VITE_MY_BOOLEAN: z.coerce.boolean().default(true),
};

export default defineConfig(({ mode }) => {
  // Validate server-side variables (PORT) using loadEnv
  const env = arkenv(Env, { env: loadEnv(mode, process.cwd(), "") });

  return {
    plugins: [
      reactPlugin(),
      arkenvVitePlugin(Env), // Validates VITE_* variables
    ],
    server: {
      port: env.PORT, // Use validated PORT
    },
  };
});
```

## Typesafe `import.meta.env`

The example includes type definitions for `import.meta.env`:

```ts title="src/vite-env.d.ts"
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MY_VAR: string;
  readonly VITE_MY_NUMBER: number;
  readonly VITE_MY_BOOLEAN: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

This makes `import.meta.env` fully typesafe in your React components:

```tsx title="src/app.tsx"
// All of these are typesafe!
const myVar = import.meta.env.VITE_MY_VAR; // string
const myNumber = import.meta.env.VITE_MY_NUMBER; // number
const myBoolean = import.meta.env.VITE_MY_BOOLEAN; // boolean
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
