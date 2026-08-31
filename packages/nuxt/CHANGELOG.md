# @arkenv/nuxt

## 1.0.0-alpha.16

### Patch Changes

<details><summary>Updated 1 dependency</summary>

<small>

[`e2e01f7`](https://github.com/yamcodes/arkenv/commit/e2e01f7edada5b3cbab3ff0479f3cdc2266dea5f)

</small>

- `@arkenv/build@1.0.0-alpha.5`

</details>

## 1.0.0-alpha.15

### Patch Changes

- #### Migrate Nuxt schema capture to isolated Symbol state _[`#1705`](https://github.com/yamcodes/arkenv/pull/1705) [`fc86350`](https://github.com/yamcodes/arkenv/commit/fc863501c02358c08b07188fe7944ec847d85277) [@yamcodes](https://github.com/yamcodes)_

	
	Schema capture in `@arkenv/nuxt` now lives on `Symbol.for("arkenv.nuxt.schemaCapture.v1")` instead of the legacy string key `__ARKENV_SCHEMA_CAPTURE__`. This isolates Nuxt's schema capture lifecycle from process-level collisions with other capture workflows.

## 1.0.0-alpha.14

### Major Changes

- #### Remove the dedicated strict layout engine _[`#1703`](https://github.com/yamcodes/arkenv/pull/1703) [`dd2b9bd`](https://github.com/yamcodes/arkenv/commit/dd2b9bd3419a14eac38c5a4b1d65932e29693b9e) [@yamcodes](https://github.com/yamcodes)_

	
	Flat `env.ts` is now the only first-class path ([ADR 0020](https://github.com/yamcodes/arkenv/blob/v1/docs/adr/0020-strict-layout-complexity-budget.md)). Scaffolding no longer asks for layout; `--strict` / `--simple` are unknown arguments. `resolveLayout` no longer auto-detects `env/client.ts` + `env/server.ts`, and `package.json` `"arkenv.layout"` is gone. `@arkenv/nextjs` and `@arkenv/nuxt` no longer export `/client`, `/server`, or Standard Schema twins; auto-extend (`#arkenv/client-env`) and Vite/Bun/Nuxt compile-time server-schema import blockers are removed. Presets target a single flat schema file (no `:client` / `:server` markers).
	
	Name/type isolation is a documented two-module recipe: two imports, optional `extends: [clientEnv]`. On Next, the server module can use `@arkenv/core` plus optional `import "server-only"`. On Nuxt, never import the server module from client code. Flat-layout value safety (prefixes, proxy, client transform, Next conditional exports on the single `env.ts`) is unchanged.
	
	**BREAKING CHANGE:** Remove first-class strict layout.
	
	Migration for prior `--strict` users:
	
	```ts
	// client module — withArkEnv / plugin schemaPath points here
	import arkenv from "@/.arkenv";
	
	export const env = arkenv({
	  NEXT_PUBLIC_API_URL: "string",
	});
	```
	
	```ts
	// server module
	import "server-only"; // optional; Next’s package, not ArkEnv’s
	import arkenv from "@arkenv/core";
	import { env as clientEnv } from "./client";
	
	export const env = arkenv(
	  {
	    DATABASE_URL: "string",
	  },
	  {
	    extends: [clientEnv],
	  },
	);
	```
	
	See [Client vs server](https://arkenv.js.org/docs/validating-your-environment/client-vs-server) and the alpha hard-cut section in [Migrating to v1](https://arkenv.js.org/docs/guides/migrating-to-v1).

### Patch Changes

<details><summary>Updated 3 dependencies</summary>

<small>

[`dcabf1f`](https://github.com/yamcodes/arkenv/commit/dcabf1fce08367529cb9a3de3101f0e6b2209901) [`61c79f6`](https://github.com/yamcodes/arkenv/commit/61c79f6846a4accff8985733884a271b69466436) [`dd2b9bd`](https://github.com/yamcodes/arkenv/commit/dd2b9bd3419a14eac38c5a4b1d65932e29693b9e)

</small>

- `@arkenv/core@1.0.0-alpha.8`
- `@arkenv/standard@1.0.0-alpha.8`
- `@arkenv/build@1.0.0-alpha.4`

</details>

## 1.0.0-alpha.13

### Patch Changes

- #### Clarify the error when client code reads a server-only env var _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  If a Client Component (or browser bundle) reads a server-only key, the overlay now says:

  ```txt
  Error: Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)
  ```

- Fix Nuxt (and Core) client rebundles failing with `Identifier "h" has already been declared` by shipping unminified `@repo/utils` / `@arkenv/nuxt` ESM that alwaysBundle multi-entry utils chunks. _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

<details><summary>Updated 3 dependencies</summary>

<small>

[`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2)

</small>

- `@arkenv/build@0.1.0-alpha.3`
- `@arkenv/core@1.0.0-alpha.5`
- `@arkenv/standard@1.0.0-alpha.5`

</details>

## 1.0.0-alpha.12

### Major Changes

- #### Stop re-exporting `type` and `Infer` from framework integrations _[`#1594`](https://github.com/yamcodes/arkenv/pull/1594) [`9ab8f48`](https://github.com/yamcodes/arkenv/commit/9ab8f483da826de0eeb034692265efaa138b3d3f) [@yamcodes](https://github.com/yamcodes)_

  Removed redundant `type` and `Infer` re-exports from `@arkenv/nextjs` (root, `/client`, `/server`, `/react-server`) and `@arkenv/nuxt` (root). Next.js codegen templates (`env.gen.ts`) also stopped emitting `export { type }`.

  Schema definition helpers (`type`, `Infer`) are now imported directly from `@arkenv/core`:

  ```ts
  // Before
  import { type, Infer } from "@arkenv/nextjs";
  // or
  import { type } from "@arkenv/nextjs/client";

  // After
  import { type, type Infer } from "@arkenv/core";
  ```

  **BREAKING CHANGE:** Removed `type` and `Infer` re-exports from `@arkenv/nextjs` and `@arkenv/nuxt`. Import schema helpers directly from `@arkenv/core`.

### Patch Changes

- #### Deepen Nuxt boot gate and thin accessor locality _[`#1592`](https://github.com/yamcodes/arkenv/pull/1592) [`d39b57b`](https://github.com/yamcodes/arkenv/commit/d39b57b25616e9f79fed5cf8f3f48f3cf0412e2c) [@yamcodes](https://github.com/yamcodes)_

  Consolidated legacy and flat schema-shape detection into a single cycle-safe helper shared between schema capture and runtime accessors. Schema loading and boot-gate coercion/application are now separable modules, and flat `arkenv()` entries share dispatch locality with strict client/server entries.

## 1.0.0-alpha.11

### Patch Changes

- #### Align missing-schema errors with short, actionable host guidance _[`#1488`](https://github.com/yamcodes/arkenv/pull/1488) [`9d5bdbb`](https://github.com/yamcodes/arkenv/commit/9d5bdbbeaf2fdddf69f5bcc47a7d79b15a51ece3) [@yamcodes](https://github.com/yamcodes)_

  Point missing-schema errors at checked paths / `schemaPath` and `arkenv init`, matching the Bun plugin style, without embedding starter `env.ts` modules.

- #### Make missing-schema errors short and actionable across hosts _[`#1495`](https://github.com/yamcodes/arkenv/pull/1495) [`3785c6b`](https://github.com/yamcodes/arkenv/commit/3785c6bfa27888a669900045b5b326e7baa1558b) [@yamcodes](https://github.com/yamcodes)_

  When a host cannot find an env schema, throw a consistent message that names the expected path / `schemaPath` and points to `npx arkenv@latest init`, without embedding a starter `env.ts` module.

  Example:

  ```text
  [ArkEnv] Could not find schema file at src/env.ts or env.ts. Please specify 'schemaPath' in ArkEnv options (or run `npx arkenv@latest init`).
  ```

- #### Make `env/internal/shared.ts` optional in strict layout _[`#1505`](https://github.com/yamcodes/arkenv/pull/1505) [`9bfe1c4`](https://github.com/yamcodes/arkenv/commit/9bfe1c4a6e278966ff2c0b2219d95e319888fb98) [@yamcodes](https://github.com/yamcodes)_

  Strict layout now works with just `client.ts` and `server.ts`. Omit `internal/shared.ts` when you have nothing to share — shared keys are treated as empty.

  ```ts
  // env/client.ts + env/server.ts alone is enough
  export default withArkEnv(nextConfig, {
    layout: "strict",
  });
  ```

  The CLI still scaffolds `shared.ts` by default for convenience.

<details><summary>Updated 1 dependency</summary>

<small>

[`3785c6b`](https://github.com/yamcodes/arkenv/commit/3785c6bfa27888a669900045b5b326e7baa1558b) [`9bfe1c4`](https://github.com/yamcodes/arkenv/commit/9bfe1c4a6e278966ff2c0b2219d95e319888fb98)

</small>

- `@arkenv/build@0.0.2-alpha.2`

</details>

## 1.0.0-alpha.10

### Major Changes

- #### Throw when the Nuxt module cannot resolve an env schema _[`#1473`](https://github.com/yamcodes/arkenv/pull/1473) [`0763a92`](https://github.com/yamcodes/arkenv/commit/0763a92db0bd88609cc70ec29663e127183328e9) [@yamcodes](https://github.com/yamcodes)_

  **BREAKING CHANGE**: The `@arkenv/nuxt` module now throws when no schema file is found (auto-discovery or `schemaPath`), instead of warning and skipping setup. Create an `env.ts` (or `src/env.ts`) schema, or set `arkenv.schemaPath` in `nuxt.config.ts`.

  ```ts
  // nuxt.config.ts
  export default defineNuxtConfig({
    modules: ["@arkenv/nuxt/module"],
    arkenv: {
      schemaPath: "./env.ts", // required if auto-discovery cannot find a schema
    },
  });
  ```

### Minor Changes

- #### Auto-extend shared schema in Nuxt strict-layout client entry _[`#1422`](https://github.com/yamcodes/arkenv/pull/1422) [`b1d8bad`](https://github.com/yamcodes/arkenv/commit/b1d8badc33523ea80a5d54683d503ad214337e80) [@yamcodes](https://github.com/yamcodes)_

  **`@arkenv/nuxt`:** When the module runs in strict layout, omitting `extends` in `env/client.ts` auto-merges `SharedSchema` from `env/internal/shared.ts` via `#arkenv/shared-schema`. Applies to both `@arkenv/nuxt/client` and `@arkenv/nuxt/standard/client`. The server entry continues to auto-merge the composed client env.

  **`arkenv` (CLI):** The Nuxt strict scaffold now emits that simplified client template (no manual `SharedSchema` import or `extends` block). Next.js scaffolds remain unchanged.

  Usage:

  ```ts
  import arkenv from "@arkenv/nuxt/client";

  export const env = arkenv({
    NUXT_PUBLIC_API_URL: "string",
  });
  ```

  Auto-merge only runs when the `extends` key is omitted. Any explicit `extends` - including `extends: []` or a custom list - is used as-is and opts out of auto-merge. Strict layout still requires `env/internal/shared.ts` with a `SharedSchema` export — that schema may be empty (`type({})`) when you have no shared variables. A missing file or unusable export fails with a clear diagnostic (rather than silently treating shared as empty).

### Patch Changes

- #### Coerce Nuxt public env overrides instead of leaving them as strings _[`#1458`](https://github.com/yamcodes/arkenv/pull/1458) [`3667b7e`](https://github.com/yamcodes/arkenv/commit/3667b7e9a1bc4547e247a9f4783d7a4e6c12782f) [@yamcodes](https://github.com/yamcodes)_

  **Bug:** With a numeric (or boolean) public schema key, setting a deploy-time override made Nitro put a _string_ into `runtimeConfig.public`. That string won, so `env` lied about the type on server and client.

  ```diff
    // env.ts
    export const env = arkenv({
      NUXT_PUBLIC_PORT: "number",
    });

    // Deploy / Nitro boot: NUXT_PUBLIC_PORT=4000
  - env.NUXT_PUBLIC_PORT; // "4000" (string) — schema said number
  + env.NUXT_PUBLIC_PORT; // 4000 (number) — coerced after the override
  ```

  Same import surface. As a side effect, `@arkenv/nuxt` / `@arkenv/nuxt/client` no longer ship the validator into the browser bundle.

- Skip all Nuxt module setup (including boot-gate hooks) when no schema file is found, matching the warn-and-bail contract. _[`#1165`](https://github.com/yamcodes/arkenv/pull/1165) [`882c0ce`](https://github.com/yamcodes/arkenv/commit/882c0ce0d62ffa3922816ad83a4a92c89f0ef764) [@yamcodes](https://github.com/yamcodes)_
- #### Drop embedded env.ts starters and warn when the Nuxt module finds no schema _[`#1468`](https://github.com/yamcodes/arkenv/pull/1468) [`0150e73`](https://github.com/yamcodes/arkenv/commit/0150e73713facc58e05508a19f72042ac40c90e6) [@yamcodes](https://github.com/yamcodes)_

  Keep missing-schema guidance short and host-parity consistent: Bun no longer embeds ArkType/Zod starters in the hybrid discovery error (prefer `arkenv init` / docs). When the Nuxt module is registered but no schema file is found, log a build warning and skip setup instead of failing silently.

## 1.0.0-alpha.9

### Patch Changes

- #### Keep coerced number and boolean env values through the security proxy _[`#1429`](https://github.com/yamcodes/arkenv/pull/1429) [`6be63f7`](https://github.com/yamcodes/arkenv/commit/6be63f78f1f8517a64a32d003e0ea6b1ae78f4be) [@yamcodes](https://github.com/yamcodes)_

  Lock the Nuxt security proxy so schema-key reads return the coerced validation target. A key declared as `"number"` or `"boolean"` returns a number or boolean at runtime, not a raw string from Nuxt runtime config / `__NUXT__`.

  ```ts
  import { arkenv } from "@arkenv/nuxt";

  export const env = arkenv({
    NUXT_PUBLIC_PORT: "number",
    PORT: "number",
  });

  // 3000 (number), not "3000" (string)
  env.NUXT_PUBLIC_PORT;
  env.PORT;
  ```

## 1.0.0-alpha.8

### Minor Changes

- #### Auto-extend client env in Nuxt strict layout _[`#1401`](https://github.com/yamcodes/arkenv/pull/1401) [`e306798`](https://github.com/yamcodes/arkenv/commit/e3067980e80adce174e5591febe43164c7960a97) [@yamcodes](https://github.com/yamcodes)_

  **`@arkenv/nuxt`:** When the module runs in strict layout, omitting `extends` in `env/server.ts` auto-merges the client env via `#arkenv/client-env`. Applies to both `@arkenv/nuxt/server` and `@arkenv/nuxt/standard/server`.

  **`arkenv` (CLI):** The Nuxt strict scaffold now emits that simplified server template (no manual `import ./client` or `extends: [clientEnv]`).

  Usage:

  ```ts
  import arkenv from "@arkenv/nuxt/server";

  export const env = arkenv({
    DATABASE_URL: "string",
  });
  ```

  Auto-merge only runs when the `extends` key is omitted. Any explicit `extends` - including `extends: []` or a list that does not include `clientEnv` - is used as-is and opts out of auto-merge. Existing manual `extends: [clientEnv]` wiring continues to work unchanged.

## 1.0.0-alpha.7

### Patch Changes

- #### Improve npm keywords across published packages for discoverability _[`#1387`](https://github.com/yamcodes/arkenv/pull/1387) [`73e508b`](https://github.com/yamcodes/arkenv/commit/73e508ba6a7ac60d0761bcedcdbde1edfa125ad7) [@yamcodes](https://github.com/yamcodes)_

  Clean up and extend the `keywords` field of every published package so npm search, aggregators, and LLM-powered package discovery surface ArkEnv for the terms users actually search for.

  - Remove the misleading `pnpm` keyword from `@arkenv/core` and `@arkenv/standard`, and give every env-related package a shared baseline (`env`, `environment-variables`, `dotenv`, `config`, `validation`, `typesafe`, `standard-schema`) alongside their integration-specific terms.
  - Keep validator-specific terms where they belong: `arktype` on `@arkenv/core`, and `zod` + `valibot` on `@arkenv/standard`.
  - Deduplicate the repeated `arkenv` keyword in `@arkenv/vite-plugin`.
  - Extend the `arkenv` CLI keywords with `create`, `generator`, `env`, `environment-variables`, and `config`.
  - Add a keyword set to `@arkenv/fumadocs-ui`, which previously had none.

- #### Type the `arkenv` key in `nuxt.config.ts` via `@nuxt/schema` augmentation _[`#1385`](https://github.com/yamcodes/arkenv/pull/1385) [`8725d78`](https://github.com/yamcodes/arkenv/commit/8725d78d65618dfc46cd971ce2a4098ec9a77b39) [@yamcodes](https://github.com/yamcodes)_

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

<details><summary>Updated 2 dependencies</summary>

<small>

[`73e508b`](https://github.com/yamcodes/arkenv/commit/73e508ba6a7ac60d0761bcedcdbde1edfa125ad7)

</small>

- `@arkenv/core@1.0.0-alpha.4`
- `@arkenv/standard@1.0.0-alpha.4`

</details>

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
  import * as z from "zod";

  export const env = arkenv(
    {
      DATABASE_URL: z.url(),
      NEXT_PUBLIC_API_URL: z.url(),
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
  import * as z from "zod";

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
