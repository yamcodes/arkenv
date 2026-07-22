# @arkenv/nuxt

ArkEnv integration for Nuxt. Provides a typesafe, minimal-dependency environment variable parser and validator for Nuxt applications. It injects your schema into Nuxt's `runtimeConfig`, coerces values at Nitro boot (including `NUXT_PUBLIC_*` overrides), exposes thin server/client `env` accessors without shipping the validator to the browser, and blocks server secrets from leaking to the client via a Vite plugin.

## Installation

```bash
npm install @arkenv/nuxt @arkenv/core arktype
```

For Zod, Valibot, or other Standard Schema validators **without** ArkType, install `@arkenv/standard` instead of `@arkenv/core`/`arktype`, register `@arkenv/nuxt/standard/module`, and import from `@arkenv/nuxt/standard`. See the [Standard Schema docs](https://arkenv.dev/docs/nuxt/using-other-validators).

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

### 2. Define your schema in `env.ts` (Flat Layout)

The easiest way to get started is the **flat layout**, which uses a single `env.ts` file in your project root:

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

The `@arkenv/nuxt` module includes a custom Vite plugin that strictly prevents any server-side environment definitions from leaking into the client bundle. If you attempt to import `@arkenv/nuxt/server` or a userland server schema file (for example, `~/env/server.ts` in the strict layout) in a client component, the bundler will throw a compile-time error.

In flat layout, a runtime proxy throws if server-only keys are accessed in browser code.
