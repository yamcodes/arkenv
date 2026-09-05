# @arkenv/rsbuild-plugin

## 1.0.0-alpha.1

### Minor Changes

- #### Add `@arkenv/rsbuild-plugin` for Rsbuild and TanStack Start _[`#1802`](https://github.com/yamcodes/arkenv/pull/1802) [`b13f263`](https://github.com/yamcodes/arkenv/commit/b13f263a5a4828c08adf5ca156b5171901da02b8) [@yamcodes](https://github.com/yamcodes)_

	
	The new `@arkenv/rsbuild-plugin` brings the same server/client env path as `@arkenv/vite-plugin` to Rsbuild projects, including TanStack Start apps built with Rsbuild:
	
	- **Client rewrite**: in `web` and `web-worker` environments, the `env.ts` module is replaced with a scrubbed client module — public/shared keys (default prefix `PUBLIC_`) are inlined as coerced literals and server-only keys become throwing getters, so secrets never reach the browser bundle.
	- **Server passthrough**: in `node` environments the real `env.ts` runs unchanged against the deployment environment.
	- **Build-time validation**: the schema is validated via `@arkenv/build` before each environment compiles; missing or invalid required variables fail the build before assets are emitted.
	- **Dev reload**: the schema and `.env*` files are registered as build dependencies, so edits re-validate and refresh inlined values during `rsbuild dev`.
	- **Standard Schema**: an `@arkenv/rsbuild-plugin/standard` entry mirrors the ArkType-free path of `@arkenv/vite-plugin/standard`.
	
	Usage:
	
	```ts
	// rsbuild.config.ts
	import { defineConfig } from "@rsbuild/core";
	import { arkenvPlugin } from "@arkenv/rsbuild-plugin";
	
	export default defineConfig({
	  plugins: [arkenvPlugin({ schemaPath: "src/env.ts" })],
	});
	```
	
	Install with `npm install @arkenv/rsbuild-plugin arktype`.
