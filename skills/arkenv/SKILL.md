---
name: arkenv
description: "Answer questions about ArkEnv and help implement environment variable validation. Use when developers: (1) Ask about environment variable validation or typesafety, (2) Want to setup ArkEnv in a project, (3) Need to define or update schemas using ArkType or Standard Schema, (4) Are integrating with Next.js, Nuxt, Vite, Bun, or Node.js runtimes. Triggers on: 'ArkEnv', 'env validation', 'typesafe env', 'createEnv', 'env.ts', 'arkenv'."
---

# ArkEnv

ArkEnv is a typesafe environment variable validation library for modern JavaScript and TypeScript frameworks. It provides a **single canonical surface across all frameworks: `import { env } from "./env"`**.

In v1, ArkEnv offers two first-class validation engines:
- **`@arkenv/core`**: Built-in ArkType DSL engine for high-performance schema definition and automatic coercion.
- **`@arkenv/standard`**: Standard Schema engine supporting any compliant validator (Zod, Valibot, etc.).

---

## Capabilities

### Core usage

- Define typesafe schemas using `@arkenv/core` ArkType DSL strings or `@arkenv/standard` with Zod / Valibot.
- Automatic coercion (`string.numeric`, `number.port`, booleans, JSON objects, arrays) and default values (`"boolean = true"`).
- Single, uniform developer experience: import `env` directly across frontend and backend code.

### Framework integration

- **Vite** (`@arkenv/vite-plugin`): Plugin operates in transform mode, rewriting imports from `env.ts` in the client graph to inline public `VITE_*` literals and replacing private server keys with throwing runtime guards.
- **Bun** (`@arkenv/bun-plugin`): Plugin intercepts `env.ts` imports in `Bun.build` / `Bun.serve` to inline public `BUN_PUBLIC_*` values while guarding server secrets.
- **Next.js** (`@arkenv/nextjs`): Build-time and runtime validation with automatic client/server isolation proxy.
- **Nuxt** (`@arkenv/nuxt`): Nuxt module with Nitro boot validation and runtime proxy guard.
- **Node.js**: Direct boot-time validation via `@arkenv/core` or `@arkenv/standard`.

### CLI (setup & DevOps)

- Initialize ArkEnv in new or existing projects using `pnpm dlx arkenv@latest init` (or `npx arkenv@latest init`).
- Automatically detect frameworks (`Next.js`, `Nuxt`, `Vite`, `Bun`, etc.) and scaffold `env.ts`.
- Add hosting provider variables via `pnpm dlx arkenv@latest add host <provider>` (Vercel, Netlify, Cloudflare, Railway, Render, Fly.io).

### Agent setup (machine-readable)

AI agents SHOULD always use the CLI for project initialization to ensure consistency:

```bash
pnpm dlx arkenv@latest init --agent
```

- **`--agent`**: Enables `--yes`, `--quiet`, and structured `--json` output.
- **Handling Refusals**: If the CLI returns `status: "error"`, inspect `code` (`GIT_TREE_DIRTY`, `REQUIREMENTS_NOT_MET`, etc.) and `retryWith`. Only pass `--force` if explicitly safe.

---

## Defining Schemas & Importing `env`

### `@arkenv/core` (ArkType DSL)

```ts title="src/env.ts"
import arkenv from "@arkenv/core";

export const env = arkenv({
  PORT: "number.port = 3000",
  DATABASE_URL: "string",
  VITE_API_URL: "string",
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
```

### `@arkenv/standard` (Standard Schema: Zod, Valibot)

```ts title="src/env.ts"
import arkenv from "@arkenv/standard";
import { z } from "zod";

export const env = arkenv({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  VITE_API_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});
```

### Consuming `env` in Application Code

Always import and read properties directly from the canonical `env` object:

```tsx title="src/App.tsx"
import { env } from "./env";

export default function App() {
  const apiUrl = env.VITE_API_URL; // string
  return <div>API URL: {apiUrl}</div>;
}
```

---

## Framework Setup Patterns

### 1. Vite (`@arkenv/vite-plugin`)

Register the plugin in `vite.config.ts` without schema arguments:

```ts title="vite.config.ts"
import { defineConfig } from "vite";
import arkenv from "@arkenv/vite-plugin";

export default defineConfig({
  plugins: [arkenv()],
});
```

If you need environment variables inside `vite.config.ts` itself (e.g. `server.port`), validate them with `loadEnv`:

```ts title="vite.config.ts"
import { defineConfig, loadEnv } from "vite";
import arkenvPlugin from "@arkenv/vite-plugin";
import arkenv, { type } from "@arkenv/core";

export const Env = type({
  PORT: "number.port = 5173",
  VITE_API_URL: "string",
});

export default defineConfig(({ mode }) => {
  const env = arkenv(Env, { env: loadEnv(mode, process.cwd(), "") });
  return {
    plugins: [arkenvPlugin()],
    server: { port: env.PORT },
  };
});
```

### 2. Bun (`@arkenv/bun-plugin`)

In `bunfig.toml`:

```toml
[serve.static]
plugins = ["@arkenv/bun-plugin"]
```

In `Bun.build`:

```ts
import arkenv from "@arkenv/bun-plugin";

await Bun.build({
  entrypoints: ["./src/index.tsx"],
  outdir: "./dist",
  plugins: [arkenv()],
});
```

---

## Security Boundaries & Layouts

- **Flat layout (default)**: `src/env.ts` contains all keys. Server graph runs full validation at boot; client graph receives inlined public literals while access to private server keys throws a runtime error.
- **Strict layout**: Split into `env/server.ts`, `env/client.ts`, and `env/internal/shared.ts`. Build plugins block server file imports from client bundles at compile time.

---

## Best Practices & Rules

1. **Always use `import { env } from "./env"`**: Never use `import.meta.env` or `process.env` directly for application environment variables in v1.
2. **Never create ambient `.d.ts` augmentations**: `ImportMetaEnvAugmented` and `ProcessEnvAugmented` are legacy v0 patterns dropped in v1.
3. **Keep secrets on the server**: Never prefix server secrets (`DATABASE_URL`, `API_SECRET_KEY`) with client prefixes (`VITE_`, `NEXT_PUBLIC_`, `BUN_PUBLIC_`, `NUXT_PUBLIC_`).
