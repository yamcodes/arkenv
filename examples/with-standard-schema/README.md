# ArkEnv with Standard Schema validators example

This example demonstrates how to use ArkEnv with Standard Schema validators like Zod alongside ArkType.

## What's inside?

The example demonstrates:
- Mixing ArkType and Zod validators in the same schema
- Using Zod for complex validations and transformations
- Using ArkType for concise TypeScript-like syntax
- Full TypeScript type inference across all validators
- Practical use cases for each validator type

## Key Features

### ArkType Validators
- **Concise syntax**: `"string.host"`, `"number.port"`, `"boolean = false"`
- **TypeScript literals**: `"'development' | 'production' | 'test'"`
- **Built-in validators**: host, port, url, email, etc.

### Zod Validators
- **Complex transformations**: `.transform()` to parse comma-separated values
- **Refinements**: `.min()`, `.max()`, custom validation logic
- **Rich error messages**: `.describe()` for better error reporting
- **Chaining**: Powerful method chaining for complex validation

## Getting started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org) installed. We recommend using [nvm](https://github.com/nvm-sh/nvm) to install it.

### Quickstart

1. #### Install dependencies
    ```bash
    npm install
    ```

2. #### Start the development server with hot reloading enabled
    ```bash
    npm run dev
    ```
    :white_check_mark: You will see the environment variables printed in the console.

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Required variables:
- `HOST` - Server hostname (validated by ArkType)
- `PORT` - Server port (validated by ArkType)
- `DATABASE_URL` - Database connection URL (validated by Zod)
- `API_KEY` - API authentication key (must be at least 32 characters, validated by Zod)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (parsed and validated by Zod)

Optional variables with defaults:
- `NODE_ENV` - Application environment (default: "development")
- `DEBUG` - Enable debug logging (default: false)
- `MAX_RETRIES` - Maximum retry attempts (default: 3)
- `TIMEOUT_MS` - Request timeout in milliseconds (default: 5000)
- `FEATURE_FLAGS` - List of enabled features (default: [])

## When to Use Each Validator

### Use ArkType when:
- You want concise, TypeScript-like syntax
- You're using built-in validators (host, port, url, etc.)
- You want string literals and union types
- Simplicity and readability are priorities

### Use Zod (or other Standard Schema validators) when:
- You need complex transformations
- You want detailed error messages
- You're migrating from another library
- Your team is already familiar with that library
- You need specific features from that library

## Next steps

- [ArkEnv Standard Schema docs](https://arkenv.js.org/docs/standard-schema)
- [ArkEnv docs](https://arkenv.js.org/docs/arkenv)
- [Zod docs](https://zod.dev/)
- [Standard Schema specification](https://standardschema.dev/)
