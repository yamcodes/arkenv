# @arkenv/rsbuild-plugin

## 1.0.0-rc.2

### Patch Changes

<details><summary>Updated 3 dependencies</summary>

<small>

[`7684644`](https://github.com/yamcodes/arkenv/commit/76846449b8a634e24b59a6126958b2826cf975ef) [`0d2f24b`](https://github.com/yamcodes/arkenv/commit/0d2f24b36a8a88af8bf1dad9ec80cbd1165551e8) [`ed09bb0`](https://github.com/yamcodes/arkenv/commit/ed09bb05c27b5409a49430c0f2897b28fe26484d) [`f71bee1`](https://github.com/yamcodes/arkenv/commit/f71bee184ed2f2abfbc69a514a551310d14b3ca5) [`2fd0f33`](https://github.com/yamcodes/arkenv/commit/2fd0f335835f3c0918da7b547b6a43fed3dfa3d7)

</small>

- `@arkenv/core@1.0.0-rc.2`
- `@arkenv/standard@1.0.0-rc.2`
- `@arkenv/build@1.0.0-rc.2`

</details>

## 1.0.0-rc.1

### Patch Changes

- #### Enter the release candidate channel _[`#1858`](https://github.com/yamcodes/arkenv/pull/1858) [`430b692`](https://github.com/yamcodes/arkenv/commit/430b692a858e7b22b30b16f06abcaacb31f97738) [@yamcodes](https://github.com/yamcodes)_

	
	Packages now ship as `1.0.0-rc.n` under the `rc` npm tag (product path also points `latest` at the RC).
<details><summary>Updated 3 dependencies</summary>

<small>

[`430b692`](https://github.com/yamcodes/arkenv/commit/430b692a858e7b22b30b16f06abcaacb31f97738)

</small>

- `@arkenv/core@1.0.0-rc.1`
- `@arkenv/standard@1.0.0-rc.1`
- `@arkenv/build@1.0.0-rc.1`

</details>

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
