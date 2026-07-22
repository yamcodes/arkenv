# @arkenv/bun-plugin

## 1.0.0-alpha.7

### Minor Changes

- #### Add `env.ts` transform for Bun fullstack apps _[`#1459`](https://github.com/yamcodes/arkenv/pull/1459) [`5fc1c6a`](https://github.com/yamcodes/arkenv/commit/5fc1c6a95a3d2a96ef7302750b1104188b230048) [@yamcodes](https://github.com/yamcodes)_

  Let the Bun plugin discover your `env.ts` and expose a shared `env` object that works in both client and server code. On the client (`Bun.build` / `[serve.static]`), public (`BUN_PUBLIC_*`) values are inlined at build time and server-only keys throw if read; on the server (`bun run` / `Bun.serve`), `env.ts` still runs normally and validates against the real environment at boot. The plugin does not rewrite your `env.ts` file on disk.

  Works with `@arkenv/bun-plugin` and `@arkenv/bun-plugin/standard`.

  Usage:

  ```ts
  // bunfig.toml — zero-config browser transform
  // [serve.static]
  // plugins = ["@arkenv/bun-plugin"]

  // or explicitly in Bun.build:
  import arkenv from "@arkenv/bun-plugin";

  await Bun.build({
    entrypoints: ["./src/index.html"],
    target: "browser",
    plugins: [arkenv], // finds src/env.ts or env.ts
    // or: arkenv({ schemaPath: "src/env.ts", clientPrefix: "BUN_PUBLIC_" })
  });
  ```

  ```ts
  // src/env.ts
  import arkenv from "@arkenv/core";

  export const env = arkenv({
    DATABASE_URL: "string",
    BUN_PUBLIC_API_URL: "string",
  });
  ```

  ```ts
  import { env } from "./env";

  env.BUN_PUBLIC_API_URL; // available on client and server
  env.DATABASE_URL; // server only — throws if read in the browser
  ```

  Passing a schema to `arkenv(schema)` (the previous `process.env` rewrite API) continues to work unchanged as SPA mode.

### Patch Changes

- #### Clarify Standard Mode missing-schema guidance with a Zod example _[`#1457`](https://github.com/yamcodes/arkenv/pull/1457) [`6cca0cf`](https://github.com/yamcodes/arkenv/commit/6cca0cf8459d6b2e75bd7b163388ab9d0a8bb782) [@yamcodes](https://github.com/yamcodes)_

  When `@arkenv/bun-plugin/standard` cannot find `env.ts`, show an illustrative Zod starter (any Standard Schema validator works — Zod is just the most common):

  ```ts
  import arkenv from "@arkenv/standard";
  import { z } from "zod";

  export default arkenv({
    BUN_PUBLIC_API_URL: z.string(),
    BUN_PUBLIC_DEBUG: z.enum(["true", "false"]),
  });
  ```

- #### Drop embedded env.ts starters and warn when the Nuxt module finds no schema _[`#1468`](https://github.com/yamcodes/arkenv/pull/1468) [`0150e73`](https://github.com/yamcodes/arkenv/commit/0150e73713facc58e05508a19f72042ac40c90e6) [@yamcodes](https://github.com/yamcodes)_

  Keep missing-schema guidance short and host-parity consistent: Bun no longer embeds ArkType/Zod starters in the hybrid discovery error (prefer `arkenv init` / docs). When the Nuxt module is registered but no schema file is found, log a build warning and skip setup instead of failing silently.

## 1.0.0-alpha.6

### Patch Changes

- #### Improve npm keywords across published packages for discoverability _[`#1387`](https://github.com/yamcodes/arkenv/pull/1387) [`73e508b`](https://github.com/yamcodes/arkenv/commit/73e508ba6a7ac60d0761bcedcdbde1edfa125ad7) [@yamcodes](https://github.com/yamcodes)_

  Clean up and extend the `keywords` field of every published package so npm search, aggregators, and LLM-powered package discovery surface ArkEnv for the terms users actually search for.

  - Remove the misleading `pnpm` keyword from `@arkenv/core` and `@arkenv/standard`, and give every env-related package a shared baseline (`env`, `environment-variables`, `dotenv`, `config`, `validation`, `typesafe`, `standard-schema`) alongside their integration-specific terms.
  - Keep validator-specific terms where they belong: `arktype` on `@arkenv/core`, and `zod` + `valibot` on `@arkenv/standard`.
  - Deduplicate the repeated `arkenv` keyword in `@arkenv/vite-plugin`.
  - Extend the `arkenv` CLI keywords with `create`, `generator`, `env`, `environment-variables`, and `config`.
  - Add a keyword set to `@arkenv/fumadocs-ui`, which previously had none.

<details><summary>Updated 2 dependencies</summary>

<small>

[`73e508b`](https://github.com/yamcodes/arkenv/commit/73e508ba6a7ac60d0761bcedcdbde1edfa125ad7)

</small>

- `@arkenv/core@1.0.0-alpha.4`
- `@arkenv/standard@1.0.0-alpha.4`

</details>

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

## 1.0.0-alpha.4

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

## 1.0.0-alpha.3

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

## 1.0.0-alpha.2

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`427ced6`](https://github.com/yamcodes/arkenv/commit/427ced6bd9af4589c5fd696906bdf712104870bb)

</small>

- `arkenv@1.0.0-alpha.2`

</details>

## 1.0.0-alpha.1

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`235ad48`](https://github.com/yamcodes/arkenv/commit/235ad482270f2078ed7a166e863edfb6908a8adf)

</small>

- `arkenv@1.0.0-alpha.1`

</details>

## 1.0.0-alpha.0

### Major Changes

- #### Initialize v1.0.0-alpha pre-releases _[`#1165`](https://github.com/yamcodes/arkenv/pull/1165) [`0e86f0d`](https://github.com/yamcodes/arkenv/commit/0e86f0d511b4f9e647da0123025f45687d89a4ed) [@yamcodes](https://github.com/yamcodes)_

  Start the pre-release track for the official v1.0.0 release.

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`0e86f0d`](https://github.com/yamcodes/arkenv/commit/0e86f0d511b4f9e647da0123025f45687d89a4ed) [`b666698`](https://github.com/yamcodes/arkenv/commit/b66669888cf2f8c756cce12fd6210c492146cd87)

</small>

- `arkenv@1.0.0-alpha.0`

</details>

## 0.1.10

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`a3e32db`](https://github.com/yamcodes/arkenv/commit/a3e32db63b0b694e11487950507c06fa7b1466b0) [`12ed4f3`](https://github.com/yamcodes/arkenv/commit/12ed4f3a6c056401404c543c5157011472771bf1) [`12ed4f3`](https://github.com/yamcodes/arkenv/commit/12ed4f3a6c056401404c543c5157011472771bf1)

</small>

- `arkenv@0.12.2`

</details>

## 0.1.9

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`3bfbcb7`](https://github.com/yamcodes/arkenv/commit/3bfbcb7ee48439f0cfa71cc2f23c9555660cd905)

</small>

- `arkenv@0.12.1`

</details>

## 0.1.8

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`88b0eee`](https://github.com/yamcodes/arkenv/commit/88b0eee7a87ffaf249d69035a747f1bb55f7079b)

</small>

- `arkenv@0.12.0`

</details>

## 0.1.7

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`c6c30ab`](https://github.com/yamcodes/arkenv/commit/c6c30abbc1df4bb74b2ab5c6f689fcae557ffb05)

</small>

- `arkenv@0.11.1`

</details>

## 0.1.6

### Patch changes

<details><summary>Updated 1 dependency</summary>

<small>

[`5e8025f`](https://github.com/yamcodes/arkenv/commit/5e8025fd53e5637cd326848f6e0e0d3a20fc1a8b)

</small>

- `arkenv@0.11.0`

</details>

## 0.1.5

### Patch changes

- #### Support `NODE_ENV` in schema _[`#804`](https://github.com/yamcodes/arkenv/pull/804) [`6f8b4f0`](https://github.com/yamcodes/arkenv/commit/6f8b4f032d085c5079cf63abe17dce5e73d61f07) [@joakimbeng](https://github.com/joakimbeng)_

  When `NODE_ENV` is included in your schema, it is now validated at startup and correctly typed.

  ```ts
  // src/env.ts
  import { type } from "arkenv";

  export default type({
    BUN_PUBLIC_API_URL: "string.url",
    NODE_ENV: "'development' | 'production' | 'test'",
  });
  ```

  ```tsx
  // process.env.NODE_ENV is now typed as "development" | "production" | "test"
  <p>Mode: {process.env.NODE_ENV}</p>
  ```

## 0.1.4

### Patch changes

<details><summary>Updated 1 dependency</summary>

<small>

[`f9010d0`](https://github.com/yamcodes/arkenv/commit/f9010d00c3f05dbd9862e4aeafab099a9dea4d25)

</small>

- `arkenv@0.10.0`

</details>

## 0.1.3

### Patch changes

<details><summary>Updated 1 dependency</summary>

<small>

[`8f1b0dd`](https://github.com/yamcodes/arkenv/commit/8f1b0dd1c10773da60ea12362f162136c23ddac0)

</small>

- `arkenv@0.9.3`

</details>

## 0.1.2

### Patch changes

<details><summary>Updated 1 dependency</summary>

<small>

[`1901321`](https://github.com/yamcodes/arkenv/commit/1901321cb78c26a2e8c5ebde3dccd87941ac47bf) [`1901321`](https://github.com/yamcodes/arkenv/commit/1901321cb78c26a2e8c5ebde3dccd87941ac47bf)

</small>

- `arkenv@0.9.2`

</details>

## 0.1.1

### Patch changes

- #### Support configuration _[`#763`](https://github.com/yamcodes/arkenv/pull/763) [`06de0ef`](https://github.com/yamcodes/arkenv/commit/06de0ef3febbfc685213043ad5454f6b9e8ab564) [@yamcodes](https://github.com/yamcodes)_

  Add support for an optional configuration object as the second argument. This allows you to set the `validator` mode to `"standard"`, enabling support for libraries like Zod or Valibot without an ArkType dependency.

  ```ts
  import { z } from "zod";
  import arkenv from "@arkenv/bun-plugin";

  arkenv(
    {
      BUN_PUBLIC_API_URL: z.url(),
    },
    {
      validator: "standard",
    }
  );
  ```

<details><summary>Updated 1 dependency</summary>

<small>

[`3b747b0`](https://github.com/yamcodes/arkenv/commit/3b747b07660e035fda4a40ca90c630e283d6ba1c)

</small>

- `arkenv@0.9.1`

</details>

## 0.1.0

### Minor changes

- #### Refactoring + remove `processEnvSchema` export _[`#739`](https://github.com/yamcodes/arkenv/pull/739) [`16c6047`](https://github.com/yamcodes/arkenv/commit/16c6047dad8d797b6e87d77ca413ba6582a16916) [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)_

  **Breaking change:** We've removed the `processEnvSchema` export from this library as it's an internal utility.

### Patch changes

- #### Support for `.mts` and `.cts` extensions _[`#739`](https://github.com/yamcodes/arkenv/pull/739) [`16c6047`](https://github.com/yamcodes/arkenv/commit/16c6047dad8d797b6e87d77ca413ba6582a16916) [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)_

  Updated the Bun plugin to correctly process and load `.mts` and `.cts` files. This ensures environment variables are properly injected when using these TypeScript file extensions.

<details><summary>Updated 1 dependency</summary>

<small>

</small>

- `arkenv@0.9.0`

</details>

## 0.0.9

### Patch changes

<details><summary>Updated 1 dependency</summary>

<small>

[`6bd0741`](https://github.com/yamcodes/arkenv/commit/6bd07410f97a8756366b9432be8504a8507d0876) [`926ef9b`](https://github.com/yamcodes/arkenv/commit/926ef9b5a322187feef7fce3a842b04d5ec197fa)

</small>

- `arkenv@0.9.0`

</details>

## 0.0.8

### Patch changes

<details><summary>Updated 1 dependency</summary>

<small>

[`01c1704`](https://github.com/yamcodes/arkenv/commit/01c17041029a41f2dfcacd7dd7ed2d1cd5a8c058)

</small>

- `arkenv@0.8.3`

</details>

## 0.0.7

### Patch changes

<details><summary>Updated 1 dependency</summary>

<small>

[`7919b6d`](https://github.com/yamcodes/arkenv/commit/7919b6dcd171553d0e6e6e819a862408284e1f71)

</small>

- `arkenv@0.8.2`

</details>

## 0.0.6

### Patch changes

<details><summary>Updated 1 dependency</summary>

<small>

[`d83d746`](https://github.com/yamcodes/arkenv/commit/d83d746e5f3672b97dea1d3eff0515a04af1d0e2)

</small>

- `arkenv@0.8.1`

</details>

## 0.0.5

### Patch changes

<details><summary>Updated 1 dependency</summary>

<small>

[`adaada4`](https://github.com/yamcodes/arkenv/commit/adaada4d214c152e8d23c983aea1747d81a0e539) [`674a2ad`](https://github.com/yamcodes/arkenv/commit/674a2adfe8ffbb9bc3235f76c5d9d00e55ee37a4)

</small>

- `arkenv@0.8.0`

</details>

## 0.0.4

### Patch changes

- #### Internal refactoring to reduce type duplication _[`#544`](https://github.com/yamcodes/arkenv/pull/544) [`d4800f9`](https://github.com/yamcodes/arkenv/commit/d4800f97d162dbeb9030576f1e97a1f50d876bad) [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)_

  Refactor the plugins to re-use internal types like `FilterByPrefix` and `InferType`, defined in the core internal types package.

  This should have no effect for the end-user.

<details><summary>Updated 1 dependency</summary>

<small>

</small>

- `arkenv@0.7.8`

</details>

## 0.0.3

### Patch changes

<details><summary>Updated 1 dependency</summary>

<small>

[`e91a804`](https://github.com/yamcodes/arkenv/commit/e91a804dc6ec7d4a80d9bee94e87d3892f013729)

</small>

- `arkenv@0.7.8`

</details>

## 0.0.2

### Patch changes

- #### Fix "Type instantiation is excessively deep" error _[`1d86d18`](https://github.com/yamcodes/arkenv/commit/1d86d187b08aba7c6b83f7bdce2d47bae47c7eb9) [@yamcodes](https://github.com/yamcodes)_

  Fixed "Type instantiation is excessively deep and possibly infinite" errors when using ArkEnv with complex ArkType schemas. This was [reported](https://github.com/yamcodes/arkenv/issues/497) in the ArkEnv Vite Plugin along with [ArkType 2.1.28](https://github.com/arktypeio/arktype/blob/HEAD/ark/type/CHANGELOG.md#2128), and was fixed by an overall improvement of type stability including optimizing how generics are passed to the validation logic.

<details><summary>Updated 1 dependency</summary>

<small>

[`1d86d18`](https://github.com/yamcodes/arkenv/commit/1d86d187b08aba7c6b83f7bdce2d47bae47c7eb9)

</small>

- `arkenv@0.7.7`

</details>

## 0.0.1

### Patch changes

- Add Bun plugin for build-time environment variable validation and typesafe access, similar to the Vite plugin. _[`#439`](https://github.com/yamcodes/arkenv/pull/439) [`61a7c52`](https://github.com/yamcodes/arkenv/commit/61a7c522abb5a7e923d7c879bff1e80e6944cff2) [@yamcodes](https://github.com/yamcodes)_

  Check out the docs: https://arkenv.js.org/docs/bun-plugin
