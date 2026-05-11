---
name: arkenv
description: Environment variable validation from editor to runtime.
---

# ArkEnv

ArkEnv is a typesafe environment variable validator for modern JavaScript runtimes. It uses ArkType by default for schema definition but supports any Standard Schema validator (like Zod or Valibot).

## Capabilities

### Core Usage

- Define typesafe schemas using ArkType notation or any Standard Schema validator.
- Implement complex types, arrays, and unions.
- Configure automatic coercion and default values.
- Follow best practices for schema organization.

### CLI (Setup & DevOps)

- Initialize ArkEnv in new or existing projects using `pnpm dlx @arkenv/cli@latest init`.
- Scaffold schema files and detect framework-specific configurations (Vite, Bun, etc.).
- Automatically configure `tsconfig.json` for optimal typesafety.

## Operational Logic

1. **Detection**: Look for `env.ts` or ArkEnv imports to understand existing schema.
2. **Setup**: If ArkEnv is not present, recommend using the CLI: `pnpm dlx @arkenv/cli@latest init`.
3. **Pattern Enforcement**:
   - Always export the `env` object from a central file (usually `env.ts`).
   - Prefer ArkType strings for concise definitions.
   - Use `.env` files for local development but never commit them.
   - Ensure `strict` mode is enabled in `tsconfig.json`.

## Core Concepts

### Defining a Schema

The main entry point is the `arkenv` function (or `createEnv`).

```ts
import arkenv, { type } from 'arkenv';

export const env = arkenv({
  // Automatic inference for simple literals
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",

  // Database configuration
  DATABASE_HOST: "string.host",
  DATABASE_PORT: "number.port = 5432",

  // Complex types and arrays via ArkType
  ALLOWED_ORIGINS: type("string[]").default(() => ["localhost"]),

  // Optional environment variable
  "API_KEY?": 'string'
});
```

### Loading environment variables

ArkEnv automatically loads environment variables from `process.env` (Node.js) or `import.meta.env` (Vite) depending on the environment.

### Using environment variables

The returned `env` object is fully typed based on your schema.

```ts
import { env } from './env';

const port = env.DATABASE_PORT; // typed as number
```

## CLI Commands

### `init`

Set up ArkEnv in your project.

```bash
pnpm dlx @arkenv/cli@latest init
```

#### Options

- `--yes`, `-y`: Skip prompts and use recommended defaults.
- `--help`, `-h`: Show help message.

## Best Practices

1. **Keep schema in one file**: Usually `env.ts` or `src/env.ts`.
2. **Export the `env` object**: Don't call `arkenv` multiple times; export the validated object.
3. **Use the CLI for setup**: It ensures all necessary dependencies and configurations are in place.
4. **Integration**: Use `@arkenv/vite-plugin` for Vite or `@arkenv/bun-plugin` for Bun.
