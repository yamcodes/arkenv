---
name: arkenv
description: Environment variable validation from editor to runtime.
---

# ArkEnv

ArkEnv is a typesafe environment variable validator for modern JavaScript runtimes. It uses ArkType by default for schema definition but supports any Standard Schema validator (like Zod or Valibot).

## When to use

Use this skill when:

- You need to define a schema for environment variables.
- You need to validate and parse environment variables.
- You want to ensure environment variables are typesafe throughout the codebase.
- You are setting up ArkEnv in a new project.

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

ArkEnv automatically loads environment variables from `process.env` (Node.js) or `import.meta.env` (Vite) depending on the environment. You can also manually provide an object to validate against.

### Using environment variables

The returned `env` object is fully typed based on your schema.

```ts
import { env } from './env';

const port = env.DATABASE_PORT; // typed as number
```

## Best Practices

1. **Keep schema in one file**: Usually `env.ts` or `src/env.ts`.
2. **Export the `env` object**: Don't call `arkenv` multiple times; export the validated object.
3. **Use .env files**: For local development, but don't commit them.
4. **Use CLI for setup**: `pnpm dlx @arkenv/cli@latest init` is the recommended way to start.

## Integration

### Vite

Use `@arkenv/vite-plugin` to ensure environment variables are validated during build and available in the client.

### Bun

Use `@arkenv/bun-plugin` for seamless integration with Bun's runtime.
