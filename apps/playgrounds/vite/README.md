# ArkEnv + Vite Example

This playground uses [@arkenv/vite-plugin](https://arkenv.js.org/docs/vite-plugin) with the canonical `env` object: `import { env } from "./env"`.

- **`src/env.ts`** is the typed source of truth (boot-time validation on the server graph)
- The Vite plugin rewrites that module in the **client** graph: `VITE_*` keys become inlined coerced literals; server-only keys throw if read
- No `import.meta.env` augmentation and no schema/`define` plugin call

## Setup

```ts title="src/env.ts"
import arkenv from "@arkenv/core";

export const env = arkenv({
  PORT: "number.port",
  VITE_MY_VAR: "unknown",
  VITE_MY_NUMBER: "number",
  VITE_MY_BOOLEAN: "boolean",
});
```

```ts title="vite.config.ts"
import arkenvVitePlugin from "@arkenv/vite-plugin";
import reactPlugin from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactPlugin(), arkenvVitePlugin()],
});
```

```tsx title="src/app.tsx"
import { env } from "./env";

env.VITE_MY_VAR; // string
env.VITE_MY_NUMBER; // number
env.VITE_MY_BOOLEAN; // boolean
env.PORT; // throws on the client — server-only
```

## Environment Variables

```env
PORT=3000
VITE_MY_VAR=Hello from ArkEnv
VITE_MY_NUMBER=42
VITE_MY_BOOLEAN=true
```

## Running

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```
