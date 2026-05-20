---
"@arkenv/cli": patch
---

#### Fix scaffolding templates for Zod and Valibot validators

Vite and Bun fullstack templates now wrap schemas in `type({...})`:

```ts
import { type } from "arkenv";
import { z } from "zod";

export const Env = type({
	PORT: z.coerce.number()
});
```

Vanilla templates now call `arkenv({...})` directly without wrapping:

```ts
import arkenv from "arkenv/standard";
import { z } from "zod";

export const env = arkenv({
	PORT: z.coerce.number()
});
```
