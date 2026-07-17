# @arkenv/nuxt

## 1.0.0-alpha.6

### Patch Changes

- #### Document `ModuleOptions` with JSDoc for better editor DX _[`#1361`](https://github.com/yamcodes/arkenv/pull/1361) [`e55697e`](https://github.com/yamcodes/arkenv/commit/e55697e24976a5b8a56f43f999374fee2d1d3a84) [@yamcodes](https://github.com/yamcodes)_

  Add descriptions and `@default` tags to the `ModuleOptions` type so hovering `schemaPath`, `layout`, `validate`, `logger`, and `logLevel` in `nuxt.config.ts` surfaces inline documentation.

  ```ts title="nuxt.config.ts"
  export default defineNuxtConfig({
    modules: ["@arkenv/nuxt/module"],
    arkenv: {
      // Hovering these keys now shows their description and default value
      schemaPath: "src/env.ts",
      layout: "flat",
      validate: true,
    },
  });
  ```

## 1.0.0-alpha.5

### Minor Changes

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

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`a16e2ec`](https://github.com/yamcodes/arkenv/commit/a16e2eca0a263c2bb9006c0d869ee20608a16ccb)

</small>

- `@arkenv/build@0.0.2-alpha.1`

</details>

## 1.0.0-alpha.4

### Major Changes

- #### Remove framework `/shared` subpath exports _[`#1297`](https://github.com/yamcodes/arkenv/pull/1297) [`68ed78e`](https://github.com/yamcodes/arkenv/commit/68ed78ec8545b9b8bcc0c867033d6fa15b1caff9) [@yamcodes](https://github.com/yamcodes)_

  Drop the `./shared` export from `@arkenv/nextjs` and `@arkenv/nuxt`. Strict-layout internal schema modules should import `type` from `@arkenv/core` instead. `/client` and `/server` subpath exports are unchanged.

  **BREAKING CHANGE:** Remove `@arkenv/nextjs/shared` and `@arkenv/nuxt/shared` subpath exports.

  Migration:

  ```ts
  // Before
  import { type } from "@arkenv/nextjs/shared";

  // After
  import { type } from "@arkenv/core";
  ```

  Import mental model:

  - **Flat layout:** `import arkenv from "@arkenv/nextjs"` (or `@arkenv/nuxt`)
  - **Strict layout:** `@arkenv/nextjs/client` and `@arkenv/nextjs/server` (or Nuxt equivalents)
  - **Internal schema modules:** `import { type } from "@arkenv/core"`

### Minor Changes

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

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`90ac1e1`](https://github.com/yamcodes/arkenv/commit/90ac1e180c6c9e43651313f705b354eb9818d0ce)

</small>

- `@arkenv/build@0.0.2-alpha.0`

</details>

## 1.0.0-alpha.3

### Minor Changes

- #### Add flat-layout overload to standard mode integrations _[`#1249`](https://github.com/yamcodes/arkenv/pull/1249) [`a6ed115`](https://github.com/yamcodes/arkenv/commit/a6ed11524629bc1620b364c4cf5931b99820b0b4) [@yamcodes](https://github.com/yamcodes)_

  Introduce flat-layout signature overloads to `@arkenv/nextjs/standard` and `@arkenv/nuxt/standard`, enabling Standard Schema users (e.g., Zod, Valibot) to use the same flat environment structure as the core ArkType mode.

  Usage:

  ```ts
  import arkenv from "@arkenv/nextjs/standard";
  import { z } from "zod";

  export const env = arkenv(
    {
      DATABASE_URL: z.string().url(),
      NEXT_PUBLIC_API_URL: z.string().url(),
    },
    {
      runtimeEnv: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      },
    }
  );
  ```

## 1.0.0-alpha.2

### Major Changes

- #### Split core engine into `@arkenv/core` and `@arkenv/standard` and add standard subpath exports to framework plugins _[`#1225`](https://github.com/yamcodes/arkenv/pull/1225) [`44c840f`](https://github.com/yamcodes/arkenv/commit/44c840ff95931310be965262b0c7c3e94c80f8d8) [@yamcodes](https://github.com/yamcodes)_

  Introduce `@arkenv/standard` as a dependency-free validation engine for Standard Schema validators (e.g., Zod, Valibot), and rename the main `arkenv` package to `@arkenv/core` (with `arktype` as a required peer dependency).

  Framework plugins (`@arkenv/nextjs`, `@arkenv/nuxt`, `@arkenv/vite-plugin`, `@arkenv/bun-plugin`) now export a `/standard` subpath to allow using Standard Schema mode without any dependency on `arktype`.

  Example using `@arkenv/standard`:

  ```ts
  import arkenv from "@arkenv/standard";
  import { z } from "zod";

  export const env = arkenv({
    PORT: z.coerce.number().default(3000),
  });
  ```

  Example of Vite plugin configuration in Standard Mode:

  ```ts
  import arkenv from "@arkenv/vite-plugin/standard";
  import { defineConfig } from "vite";

  export default defineConfig({
    plugins: [arkenv()],
  });
  ```

  **BREAKING CHANGE:** The package `arkenv` has been renamed to `@arkenv/core`. Framework plugins now list `@arkenv/core` and `@arkenv/standard` as optional peer dependencies. You must install either `@arkenv/core` (if using ArkType) or `@arkenv/standard` (if using Standard Schema).

### Patch Changes

<details><summary>Updated 2 dependencies</summary>

<small>

[`44c840f`](https://github.com/yamcodes/arkenv/commit/44c840ff95931310be965262b0c7c3e94c80f8d8)

</small>

- `@arkenv/core@1.0.0-alpha.3`
- `@arkenv/standard@1.0.0-alpha.3`

</details>

## 1.0.0-alpha.1

### Major Changes

- #### Move `arkenv` to peer dependencies in framework plugins _[`#1202`](https://github.com/yamcodes/arkenv/pull/1202) [`763270c`](https://github.com/yamcodes/arkenv/commit/763270c473767c144509fb5628327635274f4611) [@yamcodes](https://github.com/yamcodes)_

  Framework plugins no longer declare `arkenv` as a regular dependency. `arkenv` is now declared as a `peerDependency` with a caret range (`^1.0.0`), ensuring a single shared instance across all plugins and the host application.

  This change prevents duplicate instances of `arkenv` in `node_modules`, which could break ArkType structural typing and schema validation at runtime.

  Plugins affected:

  - `@arkenv/nextjs`
  - `@arkenv/nuxt`
  - `@arkenv/vite-plugin`
  - `@arkenv/bun-plugin`

  Before:

  ```bash
  npm install @arkenv/nextjs
  ```

  After:

  ```bash
  npm install arkenv @arkenv/nextjs
  ```

  **BREAKING CHANGE:** Users must now install `arkenv` alongside the plugin. Previously, `arkenv` was automatically pulled in as a regular dependency.

## 0.0.2-alpha.0

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`427ced6`](https://github.com/yamcodes/arkenv/commit/427ced6bd9af4589c5fd696906bdf712104870bb)

</small>

- `arkenv@1.0.0-alpha.2`

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
