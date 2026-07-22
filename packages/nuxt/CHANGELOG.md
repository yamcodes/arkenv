# @arkenv/nuxt

## 0.1.0

### Minor Changes

- #### Throw when the Nuxt module cannot resolve an env schema _[`#1472`](https://github.com/yamcodes/arkenv/pull/1472) [`26ac771`](https://github.com/yamcodes/arkenv/commit/26ac771da428a6edda074b7aa25379f1df2b2299) [@yamcodes](https://github.com/yamcodes)_

  **BREAKING CHANGE**: The `@arkenv/nuxt` module now throws when no schema file is found (auto-discovery or `schemaPath`), instead of silently skipping setup. Create an `env.ts` (or `src/env.ts`) schema, or set `arkenv.schemaPath` in `nuxt.config.ts`.

  ```ts
  // nuxt.config.ts
  export default defineNuxtConfig({
    modules: ["@arkenv/nuxt/module"],
    arkenv: {
      schemaPath: "./env.ts", // required if auto-discovery cannot find a schema
    },
  });
  ```

## 0.0.7

### Patch Changes

- #### Fix number and boolean env values returning as strings _[`#1420`](https://github.com/yamcodes/arkenv/pull/1420) [`aecac94`](https://github.com/yamcodes/arkenv/commit/aecac944c66d337b5fd2f61ff18135c66718e85c) [@yamcodes](https://github.com/yamcodes)_

  Keep coerced types when reading from `env`. A key declared as `"number"` or `"boolean"` now returns a number or boolean at runtime, not the raw string from Nuxt runtime config.

  ```ts
  import { createEnv } from "@arkenv/nuxt";

  export const env = createEnv({
    NUXT_PUBLIC_PORT: "number",
    PORT: "number",
  });

  // Was "3000" (string) — now 3000 (number)
  env.NUXT_PUBLIC_PORT;
  env.PORT;
  ```

## 0.0.6

### Patch Changes

- #### Improve npm keywords across published packages for discoverability _[`#1383`](https://github.com/yamcodes/arkenv/pull/1383) [`bf60ab2`](https://github.com/yamcodes/arkenv/commit/bf60ab27205f39643745c7193a3755ffe96d4177) [@yamcodes](https://github.com/yamcodes)_

  Clean up and extend the `keywords` field of every published package so npm search, aggregators, and LLM-powered package discovery surface ArkEnv for the terms users actually search for.

  - Remove the misleading `pnpm` keyword from `arkenv` and add `env`, `environment-variables`, `dotenv`, `config`, `standard-schema`, and the supported validators `zod` and `valibot`.
  - Deduplicate the repeated `arkenv` keyword in `@arkenv/vite-plugin`.
  - Give every env-related package a shared baseline (`env`, `environment-variables`, `dotenv`, `config`, `validation`, `typesafe`, `standard-schema`) alongside their integration-specific terms.
  - Add a keyword set to `@arkenv/fumadocs-ui`, which previously had none.

- #### Type the `arkenv` key in `nuxt.config.ts` via `@nuxt/schema` augmentation _[`#1371`](https://github.com/yamcodes/arkenv/pull/1371) [`7d541b4`](https://github.com/yamcodes/arkenv/commit/7d541b4e7662cdea0fcd3fb7f70504ab86c4dd9b) [@yamcodes](https://github.com/yamcodes)_

  Augment `@nuxt/schema`'s `NuxtConfig` and `NuxtOptions` so the `arkenv` module options key is fully typed. Consumers now get autocomplete, type-checking, and JSDoc hovers for `arkenv` options directly in `nuxt.config.ts`, instead of falling back to a loose index signature.

  `ModuleOptions` is now an alias of the documented `ArkEnvConfigOptions`, so option hovers surface the existing JSDoc / `@default` tags from a single source of truth.

  ```ts
  export default defineNuxtConfig({
    modules: ["@arkenv/nuxt/module"],
    arkenv: {
      schemaPath: "src/env.ts", // autocompleted & type-checked
      layout: "flat",
      validate: true,
    },
  });
  ```

<details><summary>Updated 1 dependency</summary>

<small>

[`bf60ab2`](https://github.com/yamcodes/arkenv/commit/bf60ab27205f39643745c7193a3755ffe96d4177)

</small>

- `arkenv@0.12.3`

</details>

## 0.0.5

### Patch Changes

- #### Document `ModuleOptions` with JSDoc for better editor DX _[`#1352`](https://github.com/yamcodes/arkenv/pull/1352) [`29be295`](https://github.com/yamcodes/arkenv/commit/29be29514c2ad60f2cc54a33565b83bb2f37c56a) [@yamcodes](https://github.com/yamcodes)_

  Add JSDoc to the `ModuleOptions` type so hovering `schemaPath`, `layout`, and `validate` in `nuxt.config.ts` surfaces inline documentation. The docs describe auto-detection accurately: `schemaPath` is auto-discovered via `findSchemaPath`, and `layout` is auto-detected from the schema structure (`"strict"` when the split files are present, `"flat"` as the fallback).

  ```ts title="nuxt.config.ts"
  export default defineNuxtConfig({
    modules: ["@arkenv/nuxt/module"],
    arkenv: {
      // Hovering these keys now shows their description
      schemaPath: "src/env.ts",
      layout: "flat",
      validate: true,
    },
  });
  ```

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
