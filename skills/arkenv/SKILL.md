---
name: arkenv
description: "Answer questions about ArkEnv and help implement environment variable validation. Use when developers: (1) Ask about environment variable validation or typesafety, (2) Want to setup ArkEnv in a project, (3) Need to define or update schemas using ArkType or Standard Schema, (4) Are integrating with Vite, Bun, or other runtimes. Triggers on: 'ArkEnv', 'env validation', 'typesafe env', 'createEnv', 'env.ts', '@arkenv/cli'."
---

# ArkEnv

ArkEnv is a typesafe environment variable validator for modern JavaScript runtimes. It uses ArkType by default for schema definition but supports any Standard Schema validator (like Zod or Valibot).

## Capabilities

### Core Usage

- Define typesafe schemas using ArkType notation or any Standard Schema validator.
- Implement complex types, arrays, and unions.
- Configure automatic coercion and default values.
- Follow best practices for schema organization.

### Framework Integration

- **Vite**: Build-time validation and `import.meta.env` type augmentation via `@arkenv/vite-plugin`.
- **Bun**: Runtime validation and `process.env` type augmentation via `@arkenv/bun-plugin`.
- **Node.js**: Standard `process.env` validation and coercion.

### CLI (Setup & DevOps)

- Initialize ArkEnv in new or existing projects using `pnpm dlx @arkenv/cli@latest init`.
- Scaffold schema files and detect framework-specific configurations (Vite, Bun, etc.).
- Automatically configure `tsconfig.json` and environment types for optimal typesafety.

## Operational Logic

1. **Detection**:
   - Look for `env.ts` or ArkEnv imports to understand existing schema.
   - Check for framework config files (`vite.config.ts`, `bunfig.toml`, `package.json` scripts) to recommend appropriate plugins.
2. **Setup**: If ArkEnv is not present, recommend using the CLI: `pnpm dlx @arkenv/cli@latest init`.
3. **Pattern Enforcement**:
   - **Centralize Schema**: Always define the schema in a central file (e.g., `env.ts`).
   - **Frontend (Vite/Bun)**:
     - Use the appropriate plugin for build-time validation.
     - Access variables via native primitives (`import.meta.env` for Vite, `process.env` for Bun).
     - Use **Type Augmentation** to make native primitives typesafe.
   - **Backend (Node.js)**:
     - Export a validated `env` object using `arkenv(schema)`.
   - **Type Safety**: Ensure `strict` mode is enabled in `tsconfig.json`.

## Core Concepts

### Defining a Schema

The best practice is to export a schema definition using `type`.

```ts
import { type } from 'arkenv';

export const Env = type({
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
  VITE_API_URL: "string",
  PORT: "number.port = 3000"
});
```

### Usage: Node.js (Standard)

In Node.js, you validate the environment at runtime and export the result.

```ts
import arkenv from 'arkenv';
import { Env } from './env';

export const env = arkenv(Env);

// Usage
const port = env.PORT; // typed as number
```

### Usage: Vite (Frontend)

Vite requires build-time injection. Use the plugin in `vite.config.ts` and augment `ImportMetaEnv`.

```ts
// vite.config.ts
import arkenv from '@arkenv/vite-plugin';
import { Env } from './env';

export default defineConfig({
  plugins: [arkenv(Env)]
});
```

```ts
// src/vite-env.d.ts
import type { ImportMetaEnvAugmented } from "@arkenv/vite-plugin";
import type { Env } from "../env";

interface ImportMetaEnv extends ImportMetaEnvAugmented<typeof Env> {}
```

### Usage: Bun

Bun can use either runtime validation or a plugin for type augmentation.

```ts
// src/env.d.ts
import type { ProcessEnvAugmented } from "@arkenv/bun-plugin";
import type { Env } from "./env";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ProcessEnvAugmented<typeof Env> {}
  }
}
```

## CLI Commands

### `init`

Set up ArkEnv in your project. It detects your framework and configures the appropriate plugin and type augmentations.

```bash
pnpm dlx @arkenv/cli@latest init
```

## Best Practices

1. **Avoid `import { env }` in Frontend**: In Vite, `import.meta.env` should be used because variables are statically replaced. Importing a runtime-validated `env` object can lead to issues with static analysis and bundle size.
2. **Use Type Augmentation**: This is the "cleanest" way to get typesafety for `import.meta.env` or `process.env`.
3. **Re-use Schema**: Define your schema once and use it for both the plugin (build-time) and runtime validation if needed.
4. **Coercion**: ArkEnv automatically coerces strings from `.env` files (e.g., `"3000"` becomes `3000`).
