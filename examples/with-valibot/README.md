# ArkEnv with Valibot example

This example demonstrates how to use ArkEnv with [Valibot](https://valibot.dev/) for validation, without ArkType.

Because Valibot implements the [Standard Schema](https://standardschema.dev/) specification, its schemas can be passed straight to ArkEnv via the `@arkenv/standard` package. Valibot keeps JSON Schema conversion in [`@valibot/to-json-schema`](https://valibot.dev/guides/json-schema/) rather than on the schema itself, so this example wires ArkEnv's optional `toJsonSchema` escape hatch for automatic coercion.

## What's inside?

- Pure Valibot usage via `@arkenv/standard` (no ArkType dependency)
- ArkEnv coercion for `v.number()` / `v.boolean()` via `toJsonSchema` + `@valibot/to-json-schema`
- A minimal schema validating a URL, a port number, a hostname, and a boolean
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
   DEBUG=true
   ```

3. #### Start the development server with hot reloading enabled

   ```bash
   npm run dev
   ```

   :white_check_mark: You will see the validated environment variables printed in the console.

## Environment Variables

- `TEST_VALUE` - A URL (validated by Valibot)
- `PORT` - A port number (coerced from string to number via ArkEnv)
- `HOST` - `localhost` or a hostname
- `DEBUG` - A boolean (coerced from `"true"` / `"false"` via ArkEnv)

## Next steps

- [ArkEnv Standard Schema docs](https://arkenv.js.org/docs/standard-schema)
- [ArkEnv docs](https://arkenv.js.org/docs/arkenv)
- [Valibot docs](https://valibot.dev/)
- [Standard Schema specification](https://standardschema.dev/)
