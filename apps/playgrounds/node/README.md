# ArkEnv basic example

This example demonstrates how to use ArkEnv in a basic Node.js application to define typesafe, validated environment variables.

## What's inside?

The example demonstrates:

- **Declaring a schema**: Using ArkType's powerful DSL via `arkenv` in [src/index.ts](src/index.ts).
- **Custom network types**: Validating hosts and ports using `string.host` and `number.port`.
- **Automatic Coercion**: Automatically parsing strings from `.env` into booleans (`DEBUGGING`, `SHINY`) and integers (`LLAMA_COUNT`).
- **Array Parsing**: Parsing JSON-formatted arrays from `.env` using `arrayFormat: "json"`.
- **Stripping undeclared keys**: Enforcing schema-only attributes and stripping unrecognized keys (`UNRELATED`) using `onUndeclaredKey: "delete"`.
- **Default values**: Ensuring fallback values are set correctly.

## Getting started

### Quickstart

1. #### Install dependencies
   ```bash
   pnpm install
   ```

2. #### Run the script
   ```bash
   pnpm start
   ```
   You will see the environment variables parsed and printed in the console with their correct JavaScript types.

3. #### Run in watch mode
   ```bash
   pnpm dev
   ```

---

### Adding a new environment variable

Let's see how to add a new environment variable. We will add a new environment variable called `MY_ENV_VAR`.

1. #### Define the new variable in the schema
   Open [src/index.ts](src/index.ts) and add the variable:
   ```typescript
   const env = arkenv({
       // ... other definitions
       MY_ENV_VAR: "string",
   });
   ```

2. #### Notice the validation error
   If you run `pnpm start` or have `pnpm dev` running, you will see a validation error:
   ```bash
   ArkEnvError: Errors found while validating environment variables
     MY_ENV_VAR must be a string (was missing)
   ```

3. #### Define the environment variable in `.env`
   Add the variable to your `.env` file:
   ```bash
   echo "MY_ENV_VAR=hello_from_arkenv" >> .env
   ```

4. #### Use the variable in `src/index.ts`

   Add the print statement:

   ```typescript
   console.log(`MY_ENV_VAR:   ${env.MY_ENV_VAR}`);
   ```

   Running `pnpm start` will now print the new value successfully.

## Next steps

- [ArkEnv Documentation](https://arkenv.js.org/docs/arkenv)
- [ArkType Documentation](https://arktype.io/)
