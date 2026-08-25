# ArkEnv Mix and Match Example

This example demonstrates how to use **`@arkenv/core`** to mix and match **ArkType DSL** syntax with **Standard Schema** validators (like [Zod](https://zod.dev/) and [Valibot](https://valibot.dev/)) in a single environment schema.

## What's inside?

The example demonstrates:

- Mixing ArkType, Valibot, and Zod validators in the same schema
- Using ArkType for concise TypeScript-like definitions
- Using Valibot and Zod for standard schema validation
- Full TypeScript type inference across all mixed validators

```ts title="index.ts"
import arkenv from "@arkenv/core";
import * as v from "valibot";
import { z } from "zod";

export const env = arkenv({
  // ArkType DSL (compact TypeScript-like syntax)
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
  PORT: "0 <= number.integer <= 65535 = 3000",

  // Valibot Standard Schema
  DATABASE_URL: v.pipe(v.string(), v.url()),

  // Zod Standard Schema
  DEBUG: z.boolean().default(false),
  API_KEY: z.string().min(32),
});
```

## Getting started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org) installed.

### Quickstart

1. #### Install dependencies
   ```bash
   npm install
   ```

2. #### Start the development script
   ```bash
   npm run dev
   ```
   :white_check_mark: You will see the validated environment variables printed in the console.

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL` - Valid URL string (validated by Valibot)
- `API_KEY` - API key with at least 32 characters (validated by Zod)

Optional variables with defaults:

- `NODE_ENV` - Application environment (default: `"development"`, validated by ArkType)
- `PORT` - Integer port number (default: `3000`, validated by ArkType)
- `DEBUG` - Boolean flag (default: `false`, validated by Zod)

## Documentation

- [ArkEnv Documentation](https://arkenv.js.org/docs)
- [Standard Schema Specification](https://standardschema.dev/)
- [ArkType Documentation](https://arktype.io/)
- [Zod Documentation](https://zod.dev/)
- [Valibot Documentation](https://valibot.dev/)
