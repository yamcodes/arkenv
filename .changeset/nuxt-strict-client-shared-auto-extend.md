---
"@arkenv/nuxt": minor
"arkenv": minor
---

#### Auto-extend shared schema in Nuxt strict-layout client entry

**`@arkenv/nuxt`:** When the module runs in strict layout, omitting `extends` in `env/client.ts` auto-merges `SharedSchema` from `env/internal/shared.ts` via `#arkenv/shared-schema`. Applies to both `@arkenv/nuxt/client` and `@arkenv/nuxt/standard/client`. The server entry continues to auto-merge the composed client env.

**`arkenv` (CLI):** The Nuxt strict scaffold now emits that simplified client template (no manual `SharedSchema` import or `extends` block). Next.js scaffolds remain unchanged.

Usage:

```ts
import arkenv from "@arkenv/nuxt/client";

export const env = arkenv({
	NUXT_PUBLIC_API_URL: "string",
});
```

Auto-merge only runs when the `extends` key is omitted. Any explicit `extends` - including `extends: []` or a custom list - is used as-is and opts out of auto-merge. Strict layout still requires `env/internal/shared.ts` with a `SharedSchema` export — that schema may be empty (`type({})`) when you have no shared variables. A missing file or unusable export fails with a clear diagnostic (rather than silently treating shared as empty).
