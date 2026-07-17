# @arkenv/build

## 0.0.2-alpha.1

### Patch Changes

- #### Add configurable build logging to framework integrations _[`#1312`](https://github.com/yamcodes/arkenv/pull/1312) [`a16e2ec`](https://github.com/yamcodes/arkenv/commit/a16e2eca0a263c2bb9006c0d869ee20608a16ccb) [@yamcodes](https://github.com/yamcodes)_

  Add optional `logger` and `logLevel` to Next.js, Nuxt, Vite, and Bun integrations. Set `ARKENV_LOG_LEVEL` when no custom logger is provided.

  ```ts
  import { withArkEnv } from "@arkenv/nextjs/config";

  export default withArkEnv(nextConfig, {
    logLevel: "warn",
  });
  ```

  ```ts
  import arkenv from "@arkenv/vite-plugin";

  export default defineConfig({
    plugins: [arkenv(Env, { logLevel: "silent" })],
  });
  ```

  ```ts
  import arkenv from "@arkenv/bun-plugin";

  await Bun.build({
    plugins: [arkenv(Env, { logLevel: "warn" })],
  });
  ```

  Note: `@arkenv/build` is an internal package; consumers should configure logging via the framework integrations rather than importing internal helpers.

## 0.0.2-alpha.0

### Patch Changes

- #### Align Nuxt flat layout across CLI, examples, and build resolution _[`#1299`](https://github.com/yamcodes/arkenv/pull/1299) [`90ac1e1`](https://github.com/yamcodes/arkenv/commit/90ac1e180c6c9e43651313f705b354eb9818d0ce) [@yamcodes](https://github.com/yamcodes)_

  Forward-port flat layout support for Nuxt on v1 by aligning CLI scaffolding, build-time validation, runtime proxy behavior, and `@arkenv/build` layout resolution.

  Usage:

  ```ts
  // nuxt.config.ts
  export default defineNuxtConfig({
    modules: ["@arkenv/nuxt/module"],
    arkenv: { layout: "flat" },
  });
  ```

  ```ts
  // env.ts
  import arkenv from "@arkenv/nuxt";

  export const env = arkenv({
    DATABASE_URL: "string",
    NUXT_PUBLIC_API_URL: "string",
    NODE_ENV: "'development' | 'production' | 'test' = 'development'",
  });
  ```

  - `arkenv` init wizard presents "Flat (Recommended)" for Nuxt and scaffolds a flat `env.ts`
  - `@arkenv/build` `resolveLayout()` accepts `"flat"` as an alias for the single-file layout mode
  - Nuxt examples and playgrounds use flat layout conventions

## 0.0.1

### Patch Changes

- #### Introduce Nuxt support _[`#1191`](https://github.com/yamcodes/arkenv/pull/1191) [`a3e32db`](https://github.com/yamcodes/arkenv/commit/a3e32db63b0b694e11487950507c06fa7b1466b0) [@yamcodes](https://github.com/yamcodes)_

  Introduce `@arkenv/nuxt` integration package providing a Nuxt module for automatic environment variable validation and runtimeConfig mapping, and add Nuxt support to the CLI scaffold wizard. The Nuxt adapter elegantly embraces Nuxt's native configuration exposure by automatically reading from `window.__NUXT__.config.public`, eliminating the need for developers to manually pass a `runtimeEnv` or `useRuntimeConfig()` map.
