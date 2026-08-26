---
"@arkenv/standard": minor
"arkenv": minor
---

#### Add `@arkenv/standard/valibot` and `@arkenv/standard/zod-mini` subpaths

Valibot and Zod Mini now have first-class imports that bind JSON Schema converters, so `v.number()` / Mini `z.boolean()` coerce without a manual `toJsonSchema` callback. Root `@arkenv/standard` stays dependency-free. `arkenv init` scaffolds `@arkenv/standard/valibot` for Valibot.

```ts
import { arkenv } from "@arkenv/standard/valibot";
import * as v from "valibot";

export const env = arkenv({
  PORT: v.optional(v.number(), 3000),
  DEBUG: v.optional(v.boolean(), false),
});
```

```ts
import { arkenv } from "@arkenv/standard/zod-mini";
import * as z from "zod/mini";

export const env = arkenv({
  PORT: z.number(),
  DEBUG: z.boolean(),
});
```

Install `@valibot/to-json-schema` when using the Valibot subpath, and `zod` when using the Zod Mini subpath (both optional peers). TypeScript must use `moduleResolution: "bundler" | "node16" | "nodenext"`.
