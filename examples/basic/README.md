# `ark.env` basic example

This example shows how to use `ark.env` in a basic Bun application.


## What's Inside

The example demonstrates:
- Setting up environment variables with ark.env
- Using default values
- Type-safe environment configuration
- Pretty console output with picocolors

## Getting Started

### Prerequisites

Make sure you have [Bun](https://bun.sh) installed:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Quickstart

1. Install dependencies:
    ```bash
    bun install
    ```

2. Start the development server with hot reloading enabled: 
    ```bash
    bun dev
    ```
    You will see the following output:
    ```bash
    🚀 Server running at localhost:3000 in development mode
    ```

### Adding environment variables

With the development server running (if it's not - just run `bun dev`), let's see how to add a new environment variable. For this example, we'll add a new environment variable called `MY_ENV_VAR`.

1. Define the new environment variable in the schema as a **required** string:
    ```typescript
    // index.ts
    const env = ark.env({
        // other definitions...
        MY_ENV_VAR: "string"
    });
    ```

2.  Notice that the development server will show an error:
    ```bash
    ArkEnvError: Errors found while validating environment variables
      MY_ENV_VAR must be a string (was missing)
    ```
    This is **good**! It means that the environment variable is required and that the type is enforced. Let's see how to fix it. For this example, we will define the environment variable [with a `.env` file](https://yam.codes/ark.env/docs/guides/environment-configuration#using-env-files).

3. Copy the `.env.example` file to `.env`:
    ```bash
    cp .env.example .env
    ```
    > [!TIP]
    > You can run the above command in a new terminal window to keep the development server running.

4. Add a new environment variable to the `.env` file:
    ```bash
    echo "MY_ENV_VAR=new_value" >> .env
    ```

5. Notice the development server will once again show the success message:
    ```bash
    🚀 Server running at localhost:3000 in development mode
    ```
    **Awesome!** Now you can print its value:
6. Add the following line to the `index.ts` file:
    ```typescript
    console.log(env.MY_ENV_VAR);
    ```
    You will see the following output:
    ```bash
    🚀 Server running at localhost:3000 in development mode
    my_value
    ```
    **Congratulations!** You've just added a new environment variable and printed its value.

### Next steps

- [`ark.env` docs](https://github.com/yam-codes/ark.env)
- [ArkType docs](https://arktype.io/)
- [Bun docs](https://bun.sh)