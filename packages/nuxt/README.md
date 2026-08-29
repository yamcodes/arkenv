# @arkenv/nuxt

ArkEnv integration for Nuxt. Provides a typesafe environment variable parser and validator for Nuxt applications. It keeps public values correctly typed after deploy-time overrides, integrates with Nuxt's `runtimeConfig`, and blocks server-only secrets from reaching the client.

## Installation

```bash
npm install @arkenv/nuxt @arkenv/core arktype
```

For Zod, Valibot, or other Standard Schema validators **without** ArkType, install `@arkenv/standard` instead of `@arkenv/core`/`arktype`, register `@arkenv/nuxt/standard/module`, and import from `@arkenv/nuxt/standard`. See the [Standard Schema docs](https://arkenv.js.org/docs/core-concepts/standard-schema).

## Setup

The Nuxt module automatically sets up file watchers during development and performs build-time validation.

### 1. Configure `nuxt.config.ts`

Add the module to your Nuxt configuration:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@arkenv/nuxt/module"]
});
```

### 2. Define your schema in `env.ts`

Use a single `env.ts` file in your project root:

```typescript
// env.ts
import arkenv from "@arkenv/nuxt";

export const env = arkenv({
  DATABASE_URL: "string",
  NUXT_PUBLIC_API_URL: "string.host",
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
```

Variables prefixed with `NUXT_PUBLIC_` and `NODE_ENV` are automatically exposed to the client. Use `exposeToClient` for custom keys that do not follow the prefix convention.

Never import a server-only env module from client code. Prefer one flat `env.ts`; if you split into two modules for isolation, keep the server module off the client import graph and use `extends` to merge validated outputs.

---

## Runtime Config Integration

Unlike Next.js which statically inlines environment variables, Nuxt supports dynamic runtime configuration. The `@arkenv/nuxt` module automatically registers your environment schema into Nuxt's `runtimeConfig`.

- **Server keys** are placed in private `runtimeConfig`.
- **Client & Shared keys** are placed in `runtimeConfig.public`.

This allows you to safely swap public configuration values in production without needing a full rebuild!

---

## Client-Side Security

In the flat layout, a runtime proxy throws if server-only keys are accessed in browser code.
