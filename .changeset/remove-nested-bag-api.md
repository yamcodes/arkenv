---
"@arkenv/nextjs": major
"@arkenv/nuxt": major
"@arkenv/build": major
---

#### Remove the Next/Nuxt nested bag API and `expose` / `shared` aliases

**BREAKING CHANGE**: Nested `arkenv({ server, client, shared, runtimeEnv })` is no longer accepted on `@arkenv/nextjs` or `@arkenv/nuxt` (including Standard Schema entries). Option aliases `expose` and `shared` are gone; use `exposeToClient` only. Call sites that still pass the bag throw a migration-oriented error. `@arkenv/build`'s `extractKeys` likewise rejects nested bags and only reads `exposeToClient`.

Migrate to the flat form:

```ts
export const env = arkenv(
  {
    DATABASE_URL: "string",
    NEXT_PUBLIC_API_URL: "string",
    CUSTOM_PUBLIC: "string",
  },
  {
    exposeToClient: ["CUSTOM_PUBLIC"],
  },
);
```

See the [v1 migration guide](https://arkenv.js.org/docs/guides/migrating-to-v1).
