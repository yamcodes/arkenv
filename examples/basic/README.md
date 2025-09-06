# ArkEnv basic example

This example shows how to use ArkEnv in a basic Node.js application.


## What's inside?

The example demonstrates:
- Setting up environment variables with ArkEnv
- Using default values
- Typesafe environment configuration
- Pretty console output with [Chalk](https://github.com/chalk/chalk)

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

### Adding environment variables

With the development server running (if it isn't - just run `npm run dev`), let's see how to add a new environment variable. For this example, we'll add a new environment variable called `MY_ENV_VAR`.

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
    This is **good**! It means the environment variable is required and the type is enforced. Let's see how to fix it. For this example, we will define the environment variable [with a `.env` file](https://arkenv.js.org/docs/guides/environment-configuration#using-env-files).

3. #### Copy the `.env.example` file to `.env`
   
    To keep the development server running, run this command in a new terminal window:
    ```bash
    cp .env.example .env
    ```

4. #### Add a new environment variable to the `.env` file
    ```bash
    echo "MY_ENV_VAR=new_value" >> .env
    ```
    
    Notice the development server will once again print the existing environment variables.

5. #### Add the following line to the `index.ts` file
    ```typescript
    console.log(env.MY_ENV_VAR);
    ```
    You will see the new environment variable printed in the console.
    
    **Congratulations!** :tada: You've just added a new environment variable and printed its value.

### Next steps

- [ArkEnv docs](https://arkenv.js.org/)
- [ArkType docs](https://arktype.io/)
