# @arkenv/agent-plugin

## 1.0.0-alpha.1

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

## 0.0.1-alpha.0

### Patch Changes

- #### Add a coding-agent plugin with MCP `init` and `audit` tools _[`#1624`](https://github.com/yamcodes/arkenv/pull/1624) [`da7419e`](https://github.com/yamcodes/arkenv/commit/da7419e2fbe35cc100702796b4fba309101ea38f) [@yamcodes](https://github.com/yamcodes)_

  `@arkenv/agent-plugin` is now available for coding agents. Install it with
  `npx plugins add yamcodes/arkenv`. Compatible runtimes expose `/arkenv:init`
  (delegates to `arkenv init --agent`) and `/arkenv:audit` (TypeScript AST scan
  for raw `process.env` / `import.meta.env` access, client secret leaks, public
  prefix mistakes, and leftover v0 ambient `.d.ts` augmentations).

  The stdio MCP server is available after publish:

  ```bash
  npx -y @arkenv/agent-plugin@alpha
  ```

  Audit a tree programmatically:

  ```ts
  import { auditProject } from "@arkenv/agent-plugin";

  const { diagnostics } = await auditProject(".");
  ```
