# @arkenv/build

## 1.0.0-alpha.4

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

## 0.1.0-alpha.3

### Minor Changes

- #### Add strict layout support and compile-time import blocking to Vite and Bun plugins _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Added strict layout (`env/client.ts`, `env/server.ts`) support to `@arkenv/vite-plugin` and `@arkenv/bun-plugin` with compile-time import blocking:

  - Configured `@arkenv/vite-plugin` to reject client-graph imports of server-only environment schemas during build with a descriptive error.
  - Enforced compile-time server schema import blocking in `@arkenv/bun-plugin` for `target: "browser"` builds.
  - Added strict layout resolution and server schema detection utilities to `@arkenv/build` to share security mechanisms across bundler integrations.
  - Preserved existing flat layout transform behavior and zero-validator client bundle inlining.

### Patch Changes

- #### Clarify the error when client code reads a server-only env var _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  If a Client Component (or browser bundle) reads a server-only key, the overlay now says:

  ```txt
  Error: Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)
  ```

- #### Consolidate Vite and Bun plugin build plumbing into `@arkenv/build` _[`#1527`](https://github.com/yamcodes/arkenv/pull/1527) [`5e69f5e`](https://github.com/yamcodes/arkenv/commit/5e69f5ebd69bbcdde6bcf535df2c790a23943ac2) [@yamcodes](https://github.com/yamcodes)_

  Consolidated duplicated build-time utilities across `@arkenv/vite-plugin` and `@arkenv/bun-plugin` into `@arkenv/build` in accordance with ADR 0009:

  - Centralized env-module path resolution, module ID normalization, and dotenv detection helpers in `@arkenv/build`.
  - Moved schema key classification (`classifyEnvKeys`) and dynamic env module loading via `jiti` (`loadValidatedEnv`) into `@arkenv/build`.
  - Added shared prefix filtering (`filterEnvByPrefix`) and transform mode detection (`isTransformModeCall`).
  - Refactored both plugins to consume these shared utilities while preserving their public APIs and behaviors.

## 0.0.2-alpha.2

### Patch Changes

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
