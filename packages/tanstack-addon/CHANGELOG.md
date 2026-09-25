# @arkenv/tanstack-addon

## 1.0.0-rc.2

### Patch Changes

- #### Scaffold `arkenvPlugin` in the TanStack add-on _[`#2015`](https://github.com/yamcodes/arkenv/pull/2015) [`7417dd7`](https://github.com/yamcodes/arkenv/commit/7417dd7201c42e2cc987cb26c1763d7cbb9a56a2) [@yamcodes](https://github.com/yamcodes)_

	
	The TanStack CLI add-on now registers the Vite plugin as `arkenvPlugin`.
	
	```ts
	import arkenvPlugin from "@arkenv/vite-plugin";
	
	export default defineConfig({
	  plugins: [arkenvPlugin()],
	});
	```
- #### Point TanStack add-on dependencies at the current release _[`#1978`](https://github.com/yamcodes/arkenv/pull/1978) [`888e6c2`](https://github.com/yamcodes/arkenv/commit/888e6c2a7f41576dd5f2bfb9a421cfcf9aad9ad3) [@yamcodes](https://github.com/yamcodes)_

	
	Scaffolded TanStack Start apps now install `@arkenv/core`, `@arkenv/standard`, and `@arkenv/vite-plugin` at `^1.0.0-rc.2`, which matches the versions on npm `latest` and still accepts `1.0.0` when it publishes.
	
	Usage:
	
	```bash
	npx @tanstack/cli create my-app --add-ons https://arkenv.js.org/tanstack/info.json
	```

## 1.0.0-rc.1

### Patch Changes

- #### Enter the release candidate channel _[`#1858`](https://github.com/yamcodes/arkenv/pull/1858) [`430b692`](https://github.com/yamcodes/arkenv/commit/430b692a858e7b22b30b16f06abcaacb31f97738) [@yamcodes](https://github.com/yamcodes)_

	
	Packages now ship as `1.0.0-rc.n` under the `rc` npm tag (product path also points `latest` at the RC).

## 1.0.0-alpha.2

### Minor Changes

- #### Add official TanStack CLI add-on for ArkEnv _[`#1811`](https://github.com/yamcodes/arkenv/pull/1811) [`8dc35ec`](https://github.com/yamcodes/arkenv/commit/8dc35eccc078c0fb4b2fb5c1e33fdbabbc156c77) [@yamcodes](https://github.com/yamcodes)_

	
	The TanStack CLI add-on is now available for generating and configuring ArkEnv in TanStack Start applications.
	
	Features include:
	- Multi-validator support (ArkType by default; configurable for Zod or Valibot)
	- Automated `vite.config.ts` setup with `@arkenv/vite-plugin`
	- Typesafe `src/env.ts` schema definition with server secret isolation
	- Scaffolding of an interactive demo route at `/demo/arkenv` demonstrating client-side secret protection
	
	Usage:
	
	```bash
	npx @tanstack/cli create my-app --add-ons https://arkenv.js.org/tanstack/info.json
	```
	
	Or add to an existing project:
	
	```bash
	npx @tanstack/cli add https://arkenv.js.org/tanstack/info.json
	```
