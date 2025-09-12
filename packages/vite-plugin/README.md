# `@arkenv/vite-plugin`

Vite plugin to validate environment variables at build-time with ArkEnv.

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

- Build-time validation - app won't start if environment variables are invalid
- Typesafe environment variables backed by TypeScript
- Access to ArkType's powerful type system

## Usage

Simply add the plugin to your Vite config and define your environment variables:

```typescript
// vite.config.ts
import arkenv from "@arkenv/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    arkenv({
      VITE_API_URL: "string",
      VITE_NODE_ENV: "'development' | 'production' | 'test'",
      "VITE_DEBUG?": 'boolean = false',
      "VITE_ALLOWED_ORIGINS?": 'string[] = []'
    }),
  ],
});
```

## Environment Variables

Create a `.env` file in your project root:

```dotenv title=".env"
VITE_API_URL=https://api.example.com
VITE_NODE_ENV=development
VITE_DEBUG=true
VITE_ALLOWED_ORIGINS=http://localhost:3000,https://example.com
```

## Examples

See the [with-vite-react-ts example](https://github.com/yamcodes/arkenv/tree/main/examples/with-vite-react-ts) for a complete working setup.

## Documentation

For detailed documentation and more examples, visit the [ArkEnv documentation site](https://arkenv.js.org/docs).

## Related

- [ArkEnv](https://arkenv.js.org) - The core library
- [ArkType](https://arktype.io/) - The underlying validator / type system
