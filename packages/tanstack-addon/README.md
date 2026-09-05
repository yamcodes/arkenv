# @arkenv/tanstack-addon

TanStack CLI add-on for ArkEnv environment variable validation.

## Usage with TanStack CLI

Create a new TanStack Start app with ArkEnv pre-configured:

```bash
tanstack create my-app --add-ons https://arkenv.js.org/tanstack/info.json
```

Or add to an existing project:

```bash
tanstack add https://arkenv.js.org/tanstack/info.json
```

## Features

- **Multi-Validator Support**: Choose between ArkType (`@arkenv/core`), Zod (`@arkenv/standard`), or Valibot (`@arkenv/standard`).
- **Client/Server Isolation**: Inlines `VITE_` variables on the client and protects server secrets inside `createServerFn` handlers.
- **Interactive Demo**: Includes a `/demo/arkenv` route with a live client secret-leak button demonstrating runtime protection.
- **Vite Integration**: Automatically registers `arkenv()` in `vite.config.ts`.

## Development

```bash
# Compile add-on bundle and sync to apps/www/public/tanstack
pnpm build

# Run tests
pnpm test
```
