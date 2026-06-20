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
});
```

- Filter client-safe keys starting with `NEXT_PUBLIC_` and exposed keys specified in `options.expose`. `NODE_ENV` is implicitly shared.
- Exclude server-only keys from autocomplete on the client using TypeScript `Pick`.
- Wrap the returned variables in a Proxy that throws an error at runtime when a server-only variable is accessed on the client.
- Update CLI scaffolding to generate the Flat layout by default.
