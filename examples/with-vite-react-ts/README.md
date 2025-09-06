# ArkEnv Vite React TypeScript example

This example shows how to use ArkEnv with Vite for build-time environment variable validation in a React TypeScript application.


## What's inside?

The example demonstrates:
- Build-time environment variable validation using the `@arkenv/vite-plugin`
- TypeScript integration with full type inference for environment variables
- Using Vite's environment variable conventions (VITE_ prefix)
- Different environment configurations for development and production
- Client-side environment variable usage in React components

## Getting started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org) installed. We recommend using [nvm](https://github.com/nvm-sh/nvm) to install it.

### Quickstart

1. #### Install dependencies
    ```bash
    npm install
    ```

2. #### Start the development server
    ```bash
    npm run dev
    ```
    :white_check_mark: You will see the React application running with environment variables validated at build time.

3. #### Open your browser
    Navigate to the URL shown in the terminal (typically `http://localhost:5173`) to see the application running with the environment variable displayed.

### Adding environment variables

With the development server running (if it isn't - just run `npm run dev`), let's see how to add a new environment variable. For this example, we'll add a new environment variable called `VITE_API_URL`.

1. #### Define the new environment variable in the Vite plugin configuration
    ```typescript
    // vite.config.ts
    export default defineConfig({
        plugins: [
            react(),
            arkenv({
                VITE_TEST: "string",
                VITE_API_URL: "string" // Add this line
            }),
        ],
    });
    ```

2. #### Notice the development server will show a build error
    ```bash
    ArkEnvError: Errors found while validating environment variables
      VITE_API_URL must be a string (was missing)
    ```
    This is **good**! The Vite plugin validates environment variables at build time, ensuring type safety before your application even starts. Let's fix this by adding the environment variable.

3. #### Add the environment variable to your `.env.development` file
    ```bash
    echo "VITE_API_URL=https://api.example.com" >> .env.development
    ```
    
    Notice the development server will restart and the build error will disappear.

4. #### Use the environment variable in your React component
    ```typescript
    // src/App.tsx
    function App() {
        return (
            <div>
                <p>API URL: {import.meta.env.VITE_API_URL}</p>
                {/* TypeScript knows the exact type! */}
            </div>
        );
    }
    ```
    
    **Congratulations!** :tada: You've just added a new environment variable with build-time validation and full TypeScript support.

### Key features

#### Build-time validation
Unlike runtime validation, the Vite plugin catches environment variable issues during the build process, preventing invalid configurations from reaching production.

#### TypeScript integration
The plugin automatically provides type definitions for `import.meta.env`, giving you full IntelliSense and type checking:

```typescript
// TypeScript knows these are strings
console.log(import.meta.env.VITE_TEST);     // string
console.log(import.meta.env.VITE_API_URL);  // string
```

#### Environment-specific configuration
The example includes separate environment files:
- `.env.development` - Used during development
- `.env.production` - Used during production builds

#### VITE_ prefix convention
Only environment variables with the `VITE_` prefix are available in the browser for security reasons. This is a Vite convention that ArkEnv respects.

### Common questions

**Q: Why do environment variables need the VITE_ prefix?**
A: Vite only exposes environment variables that start with `VITE_` to the client-side code for security reasons. This prevents accidentally exposing server-side secrets to the browser.

**Q: When does validation happen?**
A: Validation happens at build time when Vite processes your configuration. If validation fails, the build will stop with clear error messages.

**Q: Can I use complex types like unions or arrays?**
A: Yes! You can use any ArkType definition:
```typescript
arkenv({
    "VITE_NODE_ENV": "'development' | 'production' | 'test'",
    "VITE_FEATURE_FLAGS?": "string[] = []",
    "VITE_DEBUG?": "boolean = false"
})
```

### Next steps

- [ArkEnv docs](https://arkenv.vercel.app/docs)
- [ArkType docs](https://arktype.io/)
- [Vite Environment Variables guide](https://vitejs.dev/guide/env-and-mode.html)
