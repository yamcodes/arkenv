# ArkEnv + Vite Playground

This playground demonstrates how to use [@arkenv/vite-plugin](https://arkenv.js.org/docs/vite-plugin) with Vite and React. It showcases:

- **Environment variable validation** at build-time with ArkEnv
- **Typesafe `import.meta.env`** with full TypeScript support
- **Using environment variables in Vite config** (like `server.port`)
- **Client-side environment variables** with automatic filtering of `VITE_*` prefixed variables

## Setup

The playground uses a single schema definition that's reused for both server-side config variables and client-exposed variables:

```ts title="vite.config.ts"
import arkenvVitePlugin from "@arkenv/vite-plugin";
import arkenv, { type } from "arkenv";
import { defineConfig, loadEnv } from "vite";

// Define the schema once
export const Env = type({
	PORT: "number.port",              // Server-only (used in vite.config)
	VITE_MY_VAR: "string",            // Client-exposed
	VITE_MY_NUMBER: type("string").pipe((str) => Number.parseInt(str, 10)),
	VITE_MY_BOOLEAN: type("string").pipe((str) => str === "true"),
});

export default defineConfig(({ mode }) => {
	// Validate server-side variables (PORT) using loadEnv
	const env = arkenv(Env, loadEnv(mode, process.cwd(), ""));

	return {
		plugins: [
			arkenvVitePlugin(Env), // Validates VITE_* variables
		],
		server: {
			port: env.PORT, // Use validated PORT
		},
	};
});
```

## Typesafe `import.meta.env`

The playground includes type augmentation for `import.meta.env`:

```ts title="src/vite-env.d.ts"
/// <reference types="vite/client" />

type ImportMetaEnvAugmented =
	import("@arkenv/vite-plugin").ImportMetaEnvAugmented<
		typeof import("../vite.config").Env
	>;

interface ViteTypeOptions {
	strictImportMetaEnv: unknown;
}

interface ImportMetaEnv extends ImportMetaEnvAugmented {}
```

This makes `import.meta.env` fully typesafe in your React components:

```tsx title="src/App.tsx"
// All of these are typesafe!
const myVar = import.meta.env.VITE_MY_VAR;        // ✅ string
const myNumber = import.meta.env.VITE_MY_NUMBER;  // ✅ number
const myBoolean = import.meta.env.VITE_MY_BOOLEAN; // ✅ boolean
const port = import.meta.env.PORT;                // ❌ Error: PORT is server-only
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
VITE_MY_VAR=Hello from ArkEnv
VITE_MY_NUMBER=42
VITE_MY_BOOLEAN=true
```

The plugin automatically:
- Validates all variables at build-time
- Filters to only expose `VITE_*` variables to the client
- Excludes server-only variables (like `PORT`) from the client bundle

## Running the Playground

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Documentation

For more information, see the [@arkenv/vite-plugin documentation](https://arkenv.js.org/docs/vite-plugin):

- [What is the Vite plugin?](https://arkenv.js.org/docs/vite-plugin)
- [Typing import.meta.env](https://arkenv.js.org/docs/vite-plugin/typing-import-meta-env)
- [Using ArkEnv in Vite config](https://arkenv.js.org/docs/vite-plugin/arkenv-in-viteconfig)

## Key Features Demonstrated

1. **Single Schema Definition**: The `Env` schema is defined once and reused for both server-side validation (via `loadEnv`) and client-side validation (via the plugin).

2. **Automatic Filtering**: The plugin automatically filters the schema to only expose `VITE_*` prefixed variables to the client, preventing server-only variables from leaking into the bundle.

3. **Type Safety**: With the `vite-env.d.ts` setup, `import.meta.env` is fully typesafe with autocomplete and type checking.

4. **Build-Time Validation**: Missing or invalid environment variables will cause the dev server to fail to start and production builds to fail with clear error messages.
