---
"@arkenv/nuxt": minor
"arkenv": minor
---

#### Auto-extend client env in Nuxt strict layout via `#arkenv/client-env`

**`@arkenv/nuxt`:** When the module runs in strict layout, omitting `extends` in `env/server.ts` auto-merges the client env via `#arkenv/client-env`. Applies to both `@arkenv/nuxt/server` and `@arkenv/nuxt/standard/server`.

**`arkenv` (CLI):** The Nuxt strict scaffold now emits that simplified server template (no manual `import ./client` or `extends: [clientEnv]`).

Usage:

```ts
import arkenv from "@arkenv/nuxt/server";

export const env = arkenv({
	DATABASE_URL: "string",
});
```

Auto-merge only runs when the `extends` key is omitted. Any explicit `extends` — including `extends: []` or a list that does not include `clientEnv` — is used as-is and opts out of auto-merge. Existing manual `extends: [clientEnv]` wiring continues to work unchanged.
