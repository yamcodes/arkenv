# ArkEnv Bun example

This example shows how to use ArkEnv in a Bun application, including support for frontend environment variables with prefix filtering.

## What's inside?

The example demonstrates:
- Setting up environment variables with ArkEnv
- Using default values
- Typesafe environment configuration
- **NEW**: Frontend environment variable support with prefix filtering (for Bun frontend builds)
- Cross-platform compatibility (browser-safe builds)

## Getting started

### Prerequisites

Make sure you have [Bun](https://bun.sh) installed:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Quickstart

1. #### Install dependencies
   ```bash
   bun install
   ```

2. #### Copy environment file
   ```bash
   cp .env.example .env
   ```

3. #### Start the development server with hot reloading enabled
   ```bash
   bun dev
   ```
   :white_check_mark: You will see the following output:
   ```bash
   🚀 Server running at localhost:3000 in development mode
   ```

## Frontend Environment Variables

For Bun frontend builds, environment variables need to be prefixed with `BUN_PUBLIC_` to be accessible in browser code. ArkEnv now supports this with prefix filtering:

### Example usage:

```typescript
// frontend-example.ts
import arkenv from "arkenv";

const env = arkenv(
  {
    API_URL: "string",
    PORT: "number.port", 
    DEBUG: "boolean = false",
  },
  {
    prefix: "BUN_PUBLIC_", // Only use variables with this prefix
  },
);

// env.API_URL comes from BUN_PUBLIC_API_URL
// env.PORT comes from BUN_PUBLIC_PORT  
// env.DEBUG comes from BUN_PUBLIC_DEBUG (defaults to false if not set)
```

### Environment file setup:

```bash
# .env.frontend.example
BUN_PUBLIC_API_URL=https://api.example.com
BUN_PUBLIC_PORT=8080
BUN_PUBLIC_DEBUG=true
```

### Building for frontend:

```bash
bun build frontend-example.ts --outdir ./dist
```

This will create a browser-compatible build that doesn't import Node.js-specific modules.

### Adding environment variables

With the development server running (if it isn't - just run `bun dev`), let's see how to add a new environment variable. For this example, we'll add a new environment variable called `MY_ENV_VAR`.

1. #### Define the new environment variable in the schema as a _required_ string
    ```typescript
    // index.ts
    const env = arkenv({
        // other definitions...
        MY_ENV_VAR: "string"
    });
    ```

2. #### Notice the development server will show an error
    ```bash
    ArkEnvError: Errors found while validating environment variables
      MY_ENV_VAR must be a string (was missing)
    ```
    This is **good**! It means the environment variable is required and the type is enforced. Let's see how to fix it. For this example, we will define the environment variable [with a `.env` file](https://arkenv.js.org/docs/how-to/load-environment-variables#using-env-files).

3. #### Copy the `.env.example` file to `.env`
   
    To keep the development server running, run this command in a new terminal window:
    ```bash
    cp .env.example .env
    ```

4. #### Add a new environment variable to the `.env` file
    ```bash
    echo "MY_ENV_VAR=new_value" >> .env
    ```

5. #### Notice the development server will once again show the success message
    ```bash
    🚀 Server running at localhost:3000 in development mode
    ```
    **Awesome!** Now you can print its value:

6. #### Add the following line to the `index.ts` file
    ```typescript
    console.log(env.MY_ENV_VAR);
    ```
    You will see the following output:
    ```bash
    🚀 Server running at localhost:3000 in development mode
    my_value
    ```
    **Congratulations!** :tada: You've just added a new environment variable and printed its value.

### Next steps

- [ArkEnv docs](https://arkenv.js.org/docs)
- [ArkType docs](https://arktype.io/)
- [Bun docs](https://bun.com/docs)
