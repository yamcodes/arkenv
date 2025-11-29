# ArkEnv + Bun Plugin Example

This example demonstrates how to integrate [ArkEnv](https://github.com/arktypeio/arkenv) with the [Bun plugin](https://github.com/arktypeio/arkenv/tree/main/packages/bun-plugin) in a React application. It showcases how to define a type-safe environment schema, validate environment variables at build time, and safely expose public variables to the client.

## Environment

This project uses `src/env.ts` to define the environment schema using ArkType.

Variables prefixed with `BUN_PUBLIC_` are automatically exposed to the client-side code by the Bun plugin.

### Example Configuration

Create a `.env.development` or `.env.production` file with the following values:

```env
BUN_PUBLIC_TEST=test-value
BUN_PUBLIC_BOOLEAN=true
PORT=3000
```

See `src/env.ts` for the full schema definition.

## Getting Started

To install dependencies:

```bash
bun install
```

To start a development server:

```bash
bun dev
```

## Building for Production

To build the application for production:

```bash
bun run build
```

This runs the `build.ts` script, which utilizes the ArkEnv Bun plugin. The plugin performs **build-time validation** of your environment variables against the schema defined in `src/env.ts`. If any required variables are missing or invalid, the build will fail, ensuring your application is always deployed with a valid configuration.

To run the production server:

```bash
bun start
```
