---
"@arkenv/nextjs": patch
"@arkenv/cli": patch
---

#### Add Flat Layout Mode for Next.js integration

Introduce a new "Flat" layout mode for `@arkenv/nextjs`. The Flat API allows developers to define a flat schema mapping directly to their `.env` file structure:

```ts
import arkenv from "./generated/env.gen";

export const env = arkenv({
	DATABASE_URL: "string",
	NEXT_PUBLIC_API_URL: "string",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	CUSTOM_VAR: "string",
}, {
	exposeToClient: ["CUSTOM_VAR"]
});
```

- Automatically expose `NEXT_PUBLIC_` variables and custom keys specified in `options.exposeToClient` to the client.
- Secure server-only variables at runtime via a Proxy that throws on unauthorized client access.
- Share `NODE_ENV` implicitly to match [standard Next.js build-time inlining behavior.](https://nextjs.org/docs/app/guides/environment-variables)
- Rename the configuration `layout` option value from `"simple"` to `"flat"`. `"simple"` is kept as a deprecated runtime alias and will be removed in the next major version.
- Update CLI scaffolding to generate the Flat layout by default.
- Update documentation and playground/example apps to use and recommend the Flat layout strategy.
