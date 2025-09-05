# `@arkenv/vite-plugin`

A Vite plugin for using ArkEnv to validate environment variables at build time.

## Installation

```sh
npm install @arkenv/vite-plugin arkenv arktype
```

## Quickstart

```typescript title="vite.config.ts"
import arkenv from "@arkenv/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    arkenv({
      VITE_API_URL: "string",
      VITE_APP_NAME: "'MyApp' | 'TestApp'",
      "VITE_DEBUG?": 'boolean = false'
    }),
  ],
});
```

## Features

- 🔒 **Build-time validation**: Catch missing or invalid environment variables during build
- 🚀 **TypeScript support**: Full type inference for your environment variables
- 💪 **Powered by ArkType**: Leverage ArkType's powerful type system
- ⚡ **Zero runtime overhead**: Validation happens at build time only

## Usage

The plugin validates environment variables that start with `VITE_` (Vite's convention for client-side environment variables). Define your schema in the plugin configuration:

```typescript
arkenv({
  // Required string
  VITE_API_URL: "string",
  
  // String literal union
  VITE_NODE_ENV: "'development' | 'production' | 'test'",
  
  // Optional with default
  "VITE_DEBUG?": 'boolean = false',
  
  // Array of strings
  "VITE_ALLOWED_ORIGINS?": 'string[] = []'
})
```

## Environment Variables

Create a `.env` file in your project root:

```dotenv title=".env"
VITE_API_URL=https://api.example.com
VITE_NODE_ENV=development
VITE_DEBUG=true
VITE_ALLOWED_ORIGINS=http://localhost:3000,https://example.com
```

## TypeScript Integration

The plugin automatically provides type information for `import.meta.env`:

```typescript
// TypeScript knows the exact types!
console.log(import.meta.env.VITE_API_URL);     // string
console.log(import.meta.env.VITE_NODE_ENV);    // "development" | "production" | "test"
console.log(import.meta.env.VITE_DEBUG);       // boolean
```

## Examples

See the [with-vite-react-ts example](https://github.com/yamcodes/arkenv/tree/main/examples/with-vite-react-ts) for a complete working setup.

## Documentation

For detailed documentation and more examples, visit the [ArkEnv documentation site](https://yam.codes/arkenv).

## Related

- [ArkEnv](https://github.com/yamcodes/arkenv) - The core library
- [ArkType](https://arktype.io/) - The underlying validator / type system