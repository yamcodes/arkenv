---
"@arkenv/nuxt": minor
"arkenv": minor
---

#### Auto-extend client env in Nuxt strict layout via `#arkenv/client-env`

Omit `extends: [clientEnv]` in `env/server.ts` when using `@arkenv/nuxt/module` with the strict layout. The module registers a `#arkenv/client-env` alias and injects `__ARKENV_STRICT_LAYOUT__`, so both `@arkenv/nuxt/server` and `@arkenv/nuxt/standard/server` merge the client env automatically.

The CLI strict scaffold for Nuxt emits the simplified server template (no manual `extends`).

Usage:

```ts
import arkenv from "@arkenv/nuxt/server";

export const env = arkenv({
	DATABASE_URL: "string",
});
```

Pass `extends` explicitly to override the auto-merge. Existing manual `extends: [clientEnv]` wiring continues to work unchanged.
