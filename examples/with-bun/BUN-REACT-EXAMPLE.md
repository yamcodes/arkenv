# Bun + React Example with ArkEnv

This example demonstrates using ArkEnv in a Bun + React application with frontend environment variable support.

## Key Features

- Environment variables with `BUN_PUBLIC_` prefix for frontend access
- Type-safe environment configuration
- Browser-compatible builds (no Node.js dependencies)
- Hot reloading during development

## Setup

1. **Initialize a new Bun + React project:**
   ```bash
   bun create react my-bun-app
   cd my-bun-app
   ```

2. **Install ArkEnv:**
   ```bash
   bun add arkenv arktype
   ```

3. **Create environment configuration:**
   ```typescript
   // src/env.ts
   import arkenv from "arkenv";

   export const env = arkenv(
     {
       API_URL: "string",
       DEBUG: "boolean = false",
       APP_NAME: "'MyApp' | 'TestApp' = 'MyApp'",
     },
     {
       prefix: "BUN_PUBLIC_",
     },
   );
   ```

4. **Create `.env` file:**
   ```bash
   # .env
   BUN_PUBLIC_API_URL=https://api.example.com
   BUN_PUBLIC_DEBUG=true
   BUN_PUBLIC_APP_NAME=MyApp
   ```

5. **Use in your React components:**
   ```tsx
   // src/App.tsx
   import { env } from "./env";

   function App() {
     return (
       <div>
         <h1>{env.APP_NAME}</h1>
         <p>API URL: {env.API_URL}</p>
         {env.DEBUG && <p>Debug mode is enabled</p>}
       </div>
     );
   }

   export default App;
   ```

## Running

- **Development:** `bun dev`
- **Build:** `bun run build`

## Important Notes

- Only variables prefixed with `BUN_PUBLIC_` are accessible in frontend code
- The prefix is automatically removed from the variable names in your schema
- Environment variables are validated at build time, catching errors early
- No Node.js dependencies are included in the browser bundle