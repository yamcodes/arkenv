# @arkenv/nuxt

ArkEnv integration for Nuxt. Provides a typesafe, zero-dependency (except peer dependencies) environment variable parser and validator for Nuxt applications. It automatically injects your schema into Nuxt's `runtimeConfig` and prevents server secrets from leaking to the client via a custom Vite plugin.

## Installation

```bash
npm install @arkenv/nuxt arktype
```

## Setup

The Nuxt module automatically sets up file watchers during development and performs code generation.

### 1. Configure `nuxt.config.ts`

Add the module to your Nuxt configuration:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@arkenv/nuxt/module"]
});
```

### 2. Define your schema in `env.ts` (Simple Layout)

The easiest way to get started is the **simple layout**, which uses a single `env.ts` file in your project root:

```typescript
// env.ts
import arkenv from "./generated/env.gen";

export const env = arkenv({
  server: {
    DATABASE_URL: "string",
    STRIPE_API_KEY: "string",
  },
  client: {
    NUXT_PUBLIC_API_URL: "string.host",
  },
  shared: {
    NODE_ENV: "string",
  },
});
```

*Note: For the best DX and CI/CD compatibility, we recommend committing `generated/env.gen.ts` to source control.*

### 3. Strict Layout (Optional)

If you require physical file separation for security-critical applications, `@arkenv/nuxt` supports the **strict layout**. Place your environment files in an `env/` directory:

```text
/
├── env/
│   ├── client.ts
│   ├── server.ts
│   └── internal/
│       └── shared.ts
```

The Nuxt module automatically detects the strict layout and generates a unified factory that seamlessly integrates with Nuxt.

---

## Runtime Config Integration

Unlike Next.js which statically inlines environment variables, Nuxt supports dynamic runtime configuration. The `@arkenv/nuxt` module automatically registers your environment schema into Nuxt's `runtimeConfig`.

- **Server keys** are placed in private `runtimeConfig`.
- **Client & Shared keys** are placed in `runtimeConfig.public`.

This allows you to safely swap public configuration values in production without needing a full rebuild!

---

## Client-Side Security

The `@arkenv/nuxt` module includes a custom Vite plugin that strictly prevents any server-side environment definitions from leaking into the client bundle. If you attempt to import `@arkenv/nuxt/server` in a client component, the bundler will throw a compile-time error.
