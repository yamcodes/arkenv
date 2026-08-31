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

- Initialize ArkEnv in new or existing projects using `pnpm dlx arkenv init` (or `npx arkenv init`).
- Automatically detect frameworks (`Next.js`, `Nuxt`, `Vite`, `Bun`, etc.) and scaffold `env.ts`.
- Select hosting provider preset during init (`--preset, -P <provider>` or `--host-preset, -H <provider>`).
- Apply or refresh hosting presets on Day 2 via `arkenv preset apply <provider>` without overwriting custom user schema fields.
- Remove hosting presets on Day 2 via `arkenv preset remove <provider>`.
- Automatically configure `tsconfig.json` and schema configuration pointers in `package.json`.

### Managed Preset Blocks & Day 2 Management

ArkEnv uses machine-managed comment blocks to isolate hosting provider variables (e.g. Vercel, Netlify, Cloudflare, Railway, Render, Fly) from user-defined environment variables:

```ts
export const env = arkenv({
  DATABASE_URL: "string", // User-owned field (outside markers)

  // @arkenv-preset-start vercel
  VERCEL: "string?",
  VERCEL_ENV: "'production' | 'preview' | 'development'?",
  VERCEL_URL: "string?",
  // @arkenv-preset-end vercel
});
```

#### Safe Refresh & Collision Handling
- **User-Owned Space**: Everything outside `@arkenv-preset-start/end` markers is strictly user-owned.
- **Fail-Closed on Collision**: If a preset tries to add a key that already exists outside managed blocks (unmarked) or inside another preset's block, the CLI fails closed with an actionable collision error rather than silently overwriting.
- **Nuke-and-Pave Refresh**: When re-running `arkenv preset apply <provider>`, the CLI safely replaces only the contents inside the matching preset markers, preserving user fields and formatting.
- **Malformed Marker Safety**: If markers are unclosed, mismatched, or nested, the CLI aborts without modifying files.
- **`.env.example` Sync**:
  - `preset apply` only appends missing keys if `.env.example` already exists on disk (never creates `.env`).
  - `preset remove` removes preset keys from `.env.example` only if no remaining presets in the schema use them.

### Agent setup (machine-readable)

AI agents SHOULD always use the CLI for project initialization to ensure consistency and reliability. Use the `--agent` flag for a fully automated, machine-readable experience.

- **Command**: `pnpm dlx arkenv init --agent`
- **Behavior**: The `--agent` flag automatically enables the following behaviors:
  - **`--yes`**: Bypasses all interactive prompts and uses recommended defaults.
  - **`--quiet`**: Suppresses spinners and ANSI formatting for cleaner terminal logs.
  - **`--json`**: Emits a structured JSON summary to `stdout` upon completion (all other output is sent to `stderr`).
- **Success Verification**: Parse the JSON output to verify `status: "success"` and retrieve details like the scaffolded file path.

#### Handling refusals (`status: "error"`)

`--agent` **never** implies `--force`. When a safety check trips, the CLI refuses and emits a machine-actionable JSON payload to `stdout`:

```json
{
  "status": "error",
  "code": "GIT_TREE_DIRTY",
  "message": "Git working tree is not clean.",
  "retryWith": ["--force"]
}
```

- **`code`**: a stable identifier you can branch on. Refusal codes: `REQUIREMENTS_NOT_MET`, `GIT_TREE_DIRTY`, `NON_EMPTY_DIR`. A `code` of `INTERNAL` means the CLI *broke* rather than *refused* - retrying with flags will not help.
- **`retryWith`**: the flag(s) that would bypass the check (e.g. `["--force"]`). Empty (`[]`) means the refusal is not bypassable.

**Escalation pattern**: always run `init --agent` or `preset apply --agent` **without** `--force` first. If you get `status: "error"`, inspect `code` and `retryWith`. Only re-run with the flag(s) from `retryWith` (e.g. append `--force`) once you have deliberately decided the refusal is safe to bypass - do not add `--force` pre-emptively.

---

## CLI commands

### `init`

Set up ArkEnv in your project. It detects your framework and configures the appropriate plugin and schema.

```bash
pnpm dlx arkenv init [options]
```

#### Options:
- `--preset, -P <preset>`: Specify hosting provider preset (none, vercel, netlify, cloudflare, railway, render, fly).
- `--no-codegen`: Disable Next.js codegen configuration setup.

### `preset apply`

Apply or refresh a hosting provider preset into an existing ArkEnv schema using managed comment blocks.

```bash
pnpm arkenv preset apply <provider> [options]
```

#### Options:
- `--file <path>`: Path to schema file or directory (overrides `package.json` `"arkenv"` pointer).
- `--force, -f`: Bypass clean git working tree safety check.

### `preset remove`

Safely remove a hosting provider preset and its managed block from schema files and `.env.example`.

```bash
pnpm arkenv preset remove <provider> [options]
```

#### Options:
- `--file <path>`: Path to schema file or directory (overrides `package.json` `"arkenv"` pointer).
- `--force, -f`: Bypass clean git working tree safety check.

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
import * as z from "zod";

export const env = arkenv({
  PORT: z.number().default(3000),
  DATABASE_URL: z.string(),
  VITE_API_URL: z.url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});
```

Valibot uses the `/valibot` subpath (install `@valibot/to-json-schema` as well):

```ts title="src/env.ts"
import { arkenv } from "@arkenv/standard/valibot";
import * as v from "valibot";

export const env = arkenv({
  PORT: v.optional(v.number(), 3000),
  DATABASE_URL: v.pipe(v.string(), v.url()),
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
- **Optional two-module recipe**: When secret names/types must stay off the client type graph, use two modules (client + server) with two imports and optional `extends: [clientEnv]`. Next can use `import "server-only"` + `@arkenv/core` for the server module. Nuxt: never import the server module from client code. Not a CLI `--strict` flag or package `/client` `/server` surface.

---

## Best Practices & Rules

1. **Always use `import { env } from "./env"`**: Never use `import.meta.env` or `process.env` directly for application environment variables in v1.
2. **Never create ambient `.d.ts` augmentations**: `ImportMetaEnvAugmented` and `ProcessEnvAugmented` are legacy v0 patterns dropped in v1.
3. **Keep secrets on the server**: Never prefix server secrets (`DATABASE_URL`, `API_SECRET_KEY`) with client prefixes (`VITE_`, `NEXT_PUBLIC_`, `BUN_PUBLIC_`, `NUXT_PUBLIC_`).
