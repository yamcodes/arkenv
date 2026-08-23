---
"@arkenv/nextjs": minor
"arkenv": minor
---

#### Auto-extend client env in Next.js strict layout

`@arkenv/nextjs/server` (and the Standard Schema server entry) now merges the client env automatically in strict layout when `extends` is omitted. `withArkEnv` registers a `#arkenv/client-env` alias (webpack + Turbopack) pointing at your `env/client.ts`.

```ts
import arkenv from "@arkenv/nextjs/server";

export const env = arkenv({
  DATABASE_URL: "string",
});
```

Pass an explicit `extends` list (including `extends: []`) to opt out. Flat/simple layout is unchanged. CLI strict scaffolds and docs match the simplified server template.
