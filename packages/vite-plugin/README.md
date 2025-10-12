# `@arkenv/vite-plugin`

[Vite](https://vite.dev/) plugin to validate environment variables at build-time with ArkEnv.

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

## FAQ

### Why is this a Vite only plugin? (And not a Rollup plugin?)

This plugin uses [the Vite specific `config` hook](https://vite.dev/guide/api-plugin.html#config), which is not available in Rollup.

## Examples

* [with-vite-react-ts](https://github.com/yamcodes/arkenv/tree/main/examples/with-vite-react-ts)

## Related

- [ArkEnv](https://arkenv.js.org) - Core library and docs
- [ArkType](https://arktype.io/) - Underlying validator / type system
