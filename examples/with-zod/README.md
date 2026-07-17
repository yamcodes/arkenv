# ArkEnv with Zod example

This example demonstrates how to use ArkEnv with [Zod](https://zod.dev/) for validation, without ArkType.

Because Zod implements the [Standard Schema](https://standardschema.dev/) specification, its schemas can be passed straight to ArkEnv via the `arkenv/standard` entry point.

## What's inside?

- Pure Zod usage via `arkenv/standard` (no ArkType dependency)
- A minimal schema validating a URL, a coerced number, and a hostname
- Full TypeScript type inference for the validated environment

## Getting started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org) installed. We recommend using [nvm](https://github.com/nvm-sh/nvm) to install it.

### Quickstart

1. #### Install dependencies

   ```bash
   npm install
   ```

2. #### Create a `.env` file

   ```bash
   HOST=localhost
   PORT=3000
   TEST_VALUE=https://example.com
   ```

3. #### Start the development server with hot reloading enabled

   ```bash
   npm run dev
   ```

   :white_check_mark: You will see the validated environment variables printed in the console.

## Environment Variables

- `TEST_VALUE` - A URL (validated by Zod)
- `PORT` - A port number (coerced from string to number)
- `HOST` - `localhost` or a hostname

## Next steps

- [ArkEnv Standard Schema docs](https://arkenv.js.org/docs/standard-schema)
- [ArkEnv docs](https://arkenv.js.org/docs/arkenv)
- [Zod docs](https://zod.dev/)
- [Standard Schema specification](https://standardschema.dev/)
