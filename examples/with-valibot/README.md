# ArkEnv with Valibot example

This example demonstrates how to use ArkEnv with [Valibot](https://valibot.dev/) for validation, without ArkType.

Because Valibot implements the [Standard Schema](https://standardschema.dev/) specification, its schemas can be passed straight to ArkEnv via `@arkenv/standard/valibot`. That subpath pre-configures [`@valibot/to-json-schema`](https://valibot.dev/guides/json-schema/) so `v.number()` and `v.boolean()` coerce automatically.

## What's inside?

- Pure Valibot usage via `@arkenv/standard/valibot` (no ArkType dependency)
- Zero-boilerplate ArkEnv coercion for `v.number()` / `v.boolean()`
- A minimal schema validating a URL, a port number, a hostname, and a boolean
- Full TypeScript type inference for the validated environment

## Getting started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org) installed. We recommend using [nvm](https://github.com/nvm-sh/nvm) to install it.

TypeScript projects must use `moduleResolution: "bundler" | "node16" | "nodenext"`.

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
