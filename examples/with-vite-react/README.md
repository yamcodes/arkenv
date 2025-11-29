# ArkEnv + Vite + React Example

This example demonstrates how to use [@arkenv/vite-plugin](https://arkenv.js.org/docs/vite-plugin) with Vite, React, and TypeScript. It showcases:

- **Build-time environment variable validation** with ArkEnv
- **Typesafe `import.meta.env`** with full TypeScript support
- **Using environment variables in Vite config** (like `server.port`)
- **Client-side environment variables** with automatic filtering of `VITE_*` prefixed variables

## What's Inside?

The example demonstrates:

- Build-time environment variable validation using `@arkenv/vite-plugin`
- TypeScript integration with full type inference for `import.meta.env`
- Using Vite's `loadEnv` to access environment variables in `vite.config.ts`
- Type augmentation for `import.meta.env` via `vite-env.d.ts`
- Single schema definition reused for both server-side and client-side validation

## Setup

The example uses a single schema definition that's reused for both server-side config variables and client-exposed variables:

```ts title="vite.config.ts"
import arkenvVitePlugin from "@arkenv/vite-plugin";
import react from "@vitejs/plugin-react";
import arkenv, { type } from "arkenv";
import { defineConfig, loadEnv } from "vite";

// Define the schema once using type()
export const Env = type({
	PORT: "number.port",    // Server-only (used in vite.config)
	VITE_TEST: "string",    // Client-exposed
});

export default defineConfig(({ mode }) => {
	// Validate server-side variables (PORT) using loadEnv
	const env = arkenv(Env, loadEnv(mode, process.cwd(), ""));

	return {
		plugins: [
			react(),
			arkenvVitePlugin(Env), // Validates VITE_* variables
		],
		server: {
			port: env.PORT, // Use validated PORT
		},
	};
});
```

## Typesafe `import.meta.env`

The example includes type augmentation for `import.meta.env`:

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
function App() {
	// TypeScript knows VITE_TEST is a string
	const testVar = import.meta.env.VITE_TEST; // ✅ Typesafe
	const port = import.meta.env.PORT;         // ❌ Error: PORT is server-only

	return (
		<div>
			<p>Test: {import.meta.env.VITE_TEST}</p>
		</div>
	);
}
```

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org) installed (Node.js 22+ required).

### Quickstart

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a `.env` file**
   ```bash
   echo "PORT=3000" > .env
   echo "VITE_TEST=Hello from ArkEnv" >> .env
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   
   ✅ The dev server will start on port 3000 (from `PORT` in `.env`) with environment variables validated at build time.

4. **Open your browser**
   
   Navigate to the URL shown in the terminal (typically `http://localhost:3000`) to see the application running with the environment variable displayed.

## Adding Environment Variables

Let's add a new environment variable called `VITE_API_URL`:

1. **Update the schema in `vite.config.ts`**
   ```ts
   export const Env = type({
   	PORT: "number.port",
   	VITE_TEST: "string",
   	VITE_API_URL: "string", // Add this line
   });
   ```

2. **The development server will show a build error**
   ```bash
   ArkEnvError: Errors found while validating environment variables
     VITE_API_URL must be a string (was missing)
   ```
   
   This is **good**! The plugin validates environment variables at build time, ensuring type safety before your application even starts.

3. **Add the environment variable to your `.env` file**
   ```bash
   echo "VITE_API_URL=https://api.example.com" >> .env
   ```
   
   The development server will automatically restart and the build error will disappear.

4. **Use the environment variable in your React component**
   ```tsx
   // src/App.tsx
   function App() {
   	return (
   		<div>
   			<p>API URL: {import.meta.env.VITE_API_URL}</p>
   			{/* TypeScript knows the exact type! */}
   		</div>
   	);
   }
   ```
   
   **Congratulations!** 🎉 You've just added a new environment variable with build-time validation and full TypeScript support.

## Key Features

### Build-Time Validation

Unlike runtime validation, the Vite plugin catches environment variable issues during the build process, preventing invalid configurations from reaching production. If validation fails, the dev server won't start and production builds will fail with clear error messages.

### Type Safety

With the `vite-env.d.ts` setup, `import.meta.env` is fully typesafe with:
- Full IntelliSense autocomplete
- Type checking at compile time
- Automatic filtering to only show `VITE_*` variables

### Single Schema Definition

The `Env` schema is defined once using `type()` and reused for:
1. Server-side validation (via `loadEnv` and `arkenv`) - for variables like `PORT` used in `vite.config.ts`
2. Client-side validation (via `@arkenv/vite-plugin`) - for `VITE_*` variables exposed to the browser

### Automatic Filtering

The plugin automatically filters the schema to only expose `VITE_*` prefixed variables to the client, preventing server-only variables (like `PORT`) from leaking into the client bundle.

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
VITE_TEST=Hello from ArkEnv
```

- `PORT` - Server-only variable used in `vite.config.ts` to set the dev server port
- `VITE_TEST` - Client-exposed variable available in `import.meta.env`

## Common Questions

**Q: Why do environment variables need the `VITE_` prefix?**
A: Vite only exposes environment variables that start with `VITE_` to the client-side code for security reasons. This prevents accidentally exposing server-side secrets to the browser. The plugin automatically filters your schema to only expose `VITE_*` variables.

**Q: When does validation happen?**
A: Validation happens at build time when Vite processes your configuration. If validation fails, the dev server won't start and production builds will fail with clear error messages.

**Q: Can I use complex types like unions or arrays?**
A: Yes! You can use any ArkType definition:
```ts
export const Env = type({
	VITE_NODE_ENV: "'development' | 'production' | 'test'",
	VITE_FEATURE_FLAGS: "string[]",
	VITE_DEBUG: "boolean = false",
	VITE_PORT: type("string").pipe((str) => Number.parseInt(str, 10)),
});
```

**Q: How do I use environment variables in `vite.config.ts`?**
A: Use Vite's `loadEnv` helper with ArkEnv to validate server-side variables. See the example's `vite.config.ts` or the [Using ArkEnv in Vite config](/docs/vite-plugin/arkenv-in-viteconfig) documentation.

## Documentation

For more information, see the [@arkenv/vite-plugin documentation](https://arkenv.js.org/docs/vite-plugin):

- [Introduction](https://arkenv.js.org/docs/vite-plugin)
- [Typing import.meta.env](https://arkenv.js.org/docs/vite-plugin/typing-import-meta-env)
- [Using ArkEnv in Vite config](https://arkenv.js.org/docs/vite-plugin/arkenv-in-viteconfig)

## Next Steps

- [ArkEnv documentation](https://arkenv.js.org/docs)
- [ArkType documentation](https://arktype.io/)
- [Vite Environment Variables guide](https://vite.dev/guide/env-and-mode.html)
