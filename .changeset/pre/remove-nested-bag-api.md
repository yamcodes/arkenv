---
"@arkenv/nextjs": major
"@arkenv/nuxt": major
"@arkenv/build": major
---

#### Remove nested bag API and expose/shared aliases

`@arkenv/nextjs` and `@arkenv/nuxt` no longer accept nested
`arkenv({ server, client, shared, runtimeEnv })`. Flat
`arkenv(schema, { exposeToClient, runtimeEnv })` is the only call
shape. Option aliases `expose` and `shared` are gone — use
`exposeToClient` only. Static key extraction in `@arkenv/build` (and
Next codegen) rejects nested schema source with the same migration
error.

```ts
import arkenv from "@arkenv/nextjs";

export const env = arkenv(
  {
    DATABASE_URL: "string",
    NEXT_PUBLIC_API_URL: "string",
    NODE_ENV: "string",
  },
  {
    runtimeEnv: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
  },
);
```

**BREAKING CHANGE**: Nested bags and `expose` / `shared` aliases were
removed.

```diff
- arkenv({ server: {…}, client: {…}, shared: {…}, runtimeEnv: {…} })
- arkenv(schema, { expose: ["KEY"] })
+ arkenv(schema, { exposeToClient: ["KEY"], runtimeEnv: {…} })
```
