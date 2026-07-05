# @arkenv/nuxt

## 0.0.4

### Patch Changes

- #### Add build-time validation and dynamic runtime config support _[`#1256`](https://github.com/yamcodes/arkenv/pull/1256) [`233a8cb`](https://github.com/yamcodes/arkenv/commit/233a8cb7a0bebeaa2fb971bcbbd00787fc350210) [@yamcodes](https://github.com/yamcodes)_

  - **Build-time validation**: Added automatic validation of environment variables against your schema during dev server startup and production build. Missing or invalid variables will now fail the build immediately (previously, validation was not run during build). This behavior can be controlled via the `validate` option (which defaults to `true`):
    ```ts
    // nuxt.config.ts
    export default defineNuxtConfig({
      modules: ["@arkenv/nuxt/module"],
      arkenv: {
        validate: false, // Disable build-time validation
      },
    });
    ```
  - **Dynamic runtime overrides**: Environment variables are now resolved dynamically at runtime rather than at import time. This allows you to swap environment variable values at runtime (e.g., in different deployment environments) without needing to rebuild the application.

## 0.0.3

### Patch Changes

- #### Enforce strict-layout Vite boundary for userland server imports _[`#1262`](https://github.com/yamcodes/arkenv/pull/1262) [`587e497`](https://github.com/yamcodes/arkenv/commit/587e497afc7cdae7b35738d76f9d9b34474f0eba) [@yamcodes](https://github.com/yamcodes)_

  Extend the `@arkenv/nuxt/module` Vite plugin to block client-side imports of userland server-only schema files inside the configured strict-layout schema directory. The plugin now rejects any resolved module path ending with `/server` under the schema base directory, including imports via Nuxt aliases such as `~/env/server` and `~~/env/server`.

  Server-side builds remain unaffected, and the existing branded error message is preserved:

  ```
  [ArkEnv] Importing server-only environment schema on the client is not allowed!
  ```

## 0.0.2

### Patch Changes

- #### Add flat layout support to `@arkenv/nuxt` _[`#1248`](https://github.com/yamcodes/arkenv/pull/1248) [`be8034f`](https://github.com/yamcodes/arkenv/commit/be8034f18a8afd2ff8ee2151fac66d5f47cfe5c7) [@yamcodes](https://github.com/yamcodes)_

  Introduce flat layout schema support and typesafe `createEnv` signature overloads to `@arkenv/nuxt`.

  - Add `"flat"` layout mode to `ModuleOptions` and auto-detect it when a single `env.ts` file is configured.
  - Emit a deprecation warning in development when using the legacy `"simple"` layout option.
  - Expose flat `createEnv(schema, options)` overload with type inference for `NUXT_PUBLIC_` prefixes, `NODE_ENV`, and custom `exposeToClient` variables.

<details><summary>Updated 1 dependency</summary>

<small>

[`be8034f`](https://github.com/yamcodes/arkenv/commit/be8034f18a8afd2ff8ee2151fac66d5f47cfe5c7)

</small>

- `@arkenv/build@0.0.2`

</details>

## 0.0.1

### Patch Changes

- #### Introduce Nuxt support _[`#1191`](https://github.com/yamcodes/arkenv/pull/1191) [`a3e32db`](https://github.com/yamcodes/arkenv/commit/a3e32db63b0b694e11487950507c06fa7b1466b0) [@yamcodes](https://github.com/yamcodes)_

  Introduce `@arkenv/nuxt` integration package providing a Nuxt module for automatic environment variable validation and runtimeConfig mapping, and add Nuxt support to the CLI scaffold wizard. The Nuxt adapter elegantly embraces Nuxt's native configuration exposure by automatically reading from `window.__NUXT__.config.public`, eliminating the need for developers to manually pass a `runtimeEnv` or `useRuntimeConfig()` map.

<details><summary>Updated 2 dependencies</summary>

<small>

[`a3e32db`](https://github.com/yamcodes/arkenv/commit/a3e32db63b0b694e11487950507c06fa7b1466b0) [`12ed4f3`](https://github.com/yamcodes/arkenv/commit/12ed4f3a6c056401404c543c5157011472771bf1) [`12ed4f3`](https://github.com/yamcodes/arkenv/commit/12ed4f3a6c056401404c543c5157011472771bf1) [`a3e32db`](https://github.com/yamcodes/arkenv/commit/a3e32db63b0b694e11487950507c06fa7b1466b0)

</small>

- `arkenv@0.12.2`
- `@arkenv/build@0.0.1`

</details>
