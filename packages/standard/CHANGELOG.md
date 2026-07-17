# @arkenv/standard

## 1.0.0-alpha.4

### Patch Changes

- #### Improve npm keywords across published packages for discoverability _[`#1387`](https://github.com/yamcodes/arkenv/pull/1387) [`73e508b`](https://github.com/yamcodes/arkenv/commit/73e508ba6a7ac60d0761bcedcdbde1edfa125ad7) [@yamcodes](https://github.com/yamcodes)_

  Clean up and extend the `keywords` field of every published package so npm search, aggregators, and LLM-powered package discovery surface ArkEnv for the terms users actually search for.

  - Remove the misleading `pnpm` keyword from `@arkenv/core` and `@arkenv/standard`, and give every env-related package a shared baseline (`env`, `environment-variables`, `dotenv`, `config`, `validation`, `typesafe`, `standard-schema`) alongside their integration-specific terms.
  - Keep validator-specific terms where they belong: `arktype` on `@arkenv/core`, and `zod` + `valibot` on `@arkenv/standard`.
  - Deduplicate the repeated `arkenv` keyword in `@arkenv/vite-plugin`.
  - Extend the `arkenv` CLI keywords with `create`, `generator`, `env`, `environment-variables`, and `config`.
  - Add a keyword set to `@arkenv/fumadocs-ui`, which previously had none.

## 1.0.0-alpha.3

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
