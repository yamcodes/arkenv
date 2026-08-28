# @arkenv/standard

## 1.0.0-alpha.7

### Patch Changes

- #### Drop default `z.coerce` from Zod product samples and scaffold templates _[`#1631`](https://github.com/yamcodes/arkenv/pull/1631) [`ba9f903`](https://github.com/yamcodes/arkenv/commit/ba9f9030e8291a3bc315b164012eb825693e22ba) [@yamcodes](https://github.com/yamcodes)_

  Scaffolded Zod templates, `@arkenv/standard` JSDoc examples, and official example projects now declare numeric and boolean fields with `z.number()` and `z.boolean()` instead of `z.coerce.number()` or `z.coerce.boolean()`, reflecting ArkEnv's built-in pre-coercion for Standard Schema validators.

  ```ts
  import arkenv from "@arkenv/standard";
  import { z } from "zod";

  export const env = arkenv({
    PORT: z.number().default(3000),
    DATABASE_URL: z.string().url(),
    DEBUG: z.boolean().default(false),
  });
  ```

## 1.0.0-alpha.6

### Minor Changes

- #### Add `@arkenv/standard/valibot` and `@arkenv/standard/zod-mini` subpaths _[`#1623`](https://github.com/yamcodes/arkenv/pull/1623) [`6d2e3c7`](https://github.com/yamcodes/arkenv/commit/6d2e3c740f4db54767987973d946ddcbd04fe22f) [@yamcodes](https://github.com/yamcodes)_

  Valibot and Zod Mini now have first-class imports that bind JSON Schema converters, so `v.number()` / Mini `z.boolean()` coerce without a manual `toJsonSchema` callback. Root `@arkenv/standard` stays dependency-free. `arkenv init` scaffolds `@arkenv/standard/valibot` for Valibot.

  ```ts
  import { arkenv } from "@arkenv/standard/valibot";
  import * as v from "valibot";

  export const env = arkenv({
    PORT: v.optional(v.number(), 3000),
    DEBUG: v.optional(v.boolean(), false),
  });
  ```

  ```ts
  import { arkenv } from "@arkenv/standard/zod-mini";
  import * as z from "zod/mini";

  export const env = arkenv({
    PORT: z.number(),
    DEBUG: z.boolean(),
  });
  ```

  Install `@valibot/to-json-schema` when using the Valibot subpath, and `zod` when using the Zod Mini subpath (both optional peers). TypeScript must use `moduleResolution: "bundler" | "node16" | "nodenext"`.

### Patch Changes

- #### Record the schema without reading the environment when a tool is inspecting it _[`#1622`](https://github.com/yamcodes/arkenv/pull/1622) [`a735e9a`](https://github.com/yamcodes/arkenv/commit/a735e9a7531e3d9fbf6013f1dd814c33b2c9c47a) [@yamcodes](https://github.com/yamcodes)_

  `arkenv()` now records the definition object instead of validating `process.env` when the ArkEnv CLI (or another in-process tool) is inspecting the schema. App validation is unchanged.

## 1.0.0-alpha.5

### Minor Changes

- #### Add optional `toJsonSchema` coercion callback _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Add an optional `toJsonSchema` coercion callback to the config object. Use it when a Standard Schema validator has no Standard JSON Schema on the value.

  ```ts
  import arkenv from "@arkenv/standard";
  import * as v from "valibot";
  import { toJsonSchema } from "@valibot/to-json-schema";

  export const env = arkenv(
    { PORT: v.number(), DEBUG: v.boolean() },
    {
      toJsonSchema: (schema) =>
        toJsonSchema(schema as v.GenericSchema, {
          typeMode: "input",
          target: "draft-07",
        }),
    }
  );
  ```

  Examples include:

  - Validators that keep conversion in separate helpers to save space like Valibot (above) and Zod Mini — use `z.toJSONSchema(schema as z.ZodMiniType, { io: "input", target: "draft-07" })`
  - Validators that are Standard Schema, but not Standard JSON Schema like Zod v3 (3.24+) — use `zodToJsonSchema(schema as z.ZodTypeAny, { $refStrategy: "none" })` from `zod-to-json-schema`

  Note: ArkType and Zod v4.2+ do not need this — they already expose JSON Schema and never reach the callback.

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
