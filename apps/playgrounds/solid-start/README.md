# ArkEnv + SolidStart Example

This example demonstrates how to use [@arkenv/vite-plugin](https://arkenv.js.org/docs/vite-plugin) with [SolidStart](https://start.solidjs.com). It showcases:

- **Environment variable validation** at build-time with ArkEnv
- **Typesafe `import.meta.env`** with full TypeScript support
- **Client-side environment variables** with automatic filtering of `VITE_*` prefixed variables

## Setup

The example uses a single schema definition in `app.config.ts` that defines the shape of your environment variables:

```ts title="app.config.ts"
import arkenvVitePlugin from "@arkenv/vite-plugin";
import { defineConfig } from "@solidjs/start/config";
import { type } from "arkenv/arktype";

// Define the schema
export const Env = type({
  VITE_TEST: "string",
  VITE_NUMERIC: "string.numeric",
  VITE_BOOLEAN: "boolean",
});

export default defineConfig({
  vite: {
    // Pass the schema to the plugin
    plugins: [arkenvVitePlugin(Env)],
  },
});
```

## Typesafe `import.meta.env`

The example includes type augmentation for `import.meta.env` in `src/global.d.ts`. This ensures correct TypeScript inference for all variables defined in your schema.

```ts title="src/global.d.ts"
/// <reference types="@solidjs/start/env" />

type ImportMetaEnvAugmented =
  import("@arkenv/vite-plugin").ImportMetaEnvAugmented<
    typeof import("../app.config").Env
  >;

// Augment import.meta.env with your schema
// Only `VITE_*` prefixed variables will be included
interface ImportMetaEnv extends ImportMetaEnvAugmented {}
```

This makes usage in your Solid components fully typesafe:

```tsx
const test = import.meta.env.VITE_TEST; // ✅ string
const num = import.meta.env.VITE_NUMERIC; // ✅ number
const bool = import.meta.env.VITE_BOOLEAN; // ✅ boolean
```

## Environment Variables

You can verify the validation by looking at the `.env.production` file (or creating a `.env` file):

```env title=".env.production"
VITE_TEST=Hello from SolidStart (Production)
VITE_NUMERIC=3
VITE_BOOLEAN=false
```

The plugin automatically:

- Validates all variables at build-time
- Filters to only expose `VITE_*` variables to the client
- Ensures `import.meta.env` matches your schema

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

For more information, see the [@arkenv/vite-plugin documentation](https://arkenv.js.org/docs/vite-plugin):

- [Introduction](https://arkenv.js.org/docs/vite-plugin)
- [Typing import.meta.env](https://arkenv.js.org/docs/vite-plugin/typing-import-meta-env)
- [Using ArkEnv in Vite config](https://arkenv.js.org/docs/vite-plugin/arkenv-in-viteconfig)

## this project was created with the [Solid CLI](https://github.com/solidjs-community/solid-cli)
