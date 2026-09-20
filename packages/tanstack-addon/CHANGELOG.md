# @arkenv/tanstack-addon

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
