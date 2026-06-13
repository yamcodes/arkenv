---
"@arkenv/nuxt": patch
"@arkenv/cli": patch
"@arkenv/build-tools": patch
"@arkenv/nextjs": patch
---

#### Introduce Nuxt support and update CLI scaffolding integration

Introduce the `@arkenv/nuxt` integration package to provide native framework environment variable validation, auto-codegen, and runtime configuration support in Nuxt 3 applications.

- **Nuxt Module**: Provide a `@arkenv/nuxt/module` that automatically runs schema codegen at build/dev time, sets up chokidar-based schema file watching, registers private server keys and public client/shared keys to Nuxt's `runtimeConfig`, and installs compile-time client security protection.
- **Client Security Guard**: Enforce client security via a custom Vite plugin that throws compilation errors if server-only schemas are imported on the client side, and wraps the validated environment object in a Proxy to block key enumeration (e.g. `Object.keys()`, `for...in`) on the client.
- **CLI Bootstrapping**: Add Nuxt framework auto-detection, configuration injection, and bootstrapping templates for Simple and Strict layouts to `@arkenv/cli`.
- **Next.js Parity**: Port the security proxy traps (blocking client-side enumeration of server-only variables) and type coercion pipeline improvements back to `@arkenv/nextjs`.

##### Example Usage

1. Register the module:
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@arkenv/nuxt/module"]
});
```

2. Access environment variables:
```ts
// env.ts
import arkenv from "./generated/env.gen";

export const env = arkenv({
  server: {
    DATABASE_URL: "string"
  },
  client: {
    NUXT_PUBLIC_API_URL: "string"
  }
});
```
