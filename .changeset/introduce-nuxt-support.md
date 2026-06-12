---
"@arkenv/cli": patch
"@arkenv/nuxt": patch
"@arkenv/nextjs": patch
"arkenv": patch
---

#### Introduce Nuxt support to ArkEnv

Add the `@arkenv/nuxt` package and Nuxt module integration to validate and parse environment variables at build and runtime. Support automated code generation and watch mode during development.

#### Centralize schema key extraction and fix type coercion

- Centralize the `getSchemaKeys` utility inside `arkenv` core to share it across framework integrations.
- Remove destructive `String()` coercion in `@arkenv/nuxt` and `@arkenv/nextjs` to prevent validation failures on structured environment data.

Usage:

1. Scaffold with CLI:
```sh
npx @arkenv/cli@latest init
```

2. Register the module in `nuxt.config.ts`:
```ts
export default defineNuxtConfig({
	modules: ["@arkenv/nuxt/module"]
});
```

3. Define your schema in `env.ts`:
```ts
import arkenv from "./generated/env.gen";

export const env = arkenv({
	client: {
		NUXT_PUBLIC_API_URL: "string"
	},
	server: {
		DATABASE_URL: "string"
	}
});
```
