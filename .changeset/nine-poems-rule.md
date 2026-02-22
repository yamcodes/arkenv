---
"arkenv": minor
"@arkenv/vite-plugin": patch
---

#### Add `arkenv/standard` import for non-ArkType consumers

`arkenv` now ships three separate imports:

- **`arkenv`** (main): ArkType-first. Includes `createEnv` (aliased to `arkenv` default import), `type`, and `ArkEnvError`. The `type` helper, previously at `arkenv/arktype`, has moved here.
- **`arkenv/standard`**: ArkType-free. A standalone `createEnv` (aliased to `arkenv` default import) for Standard Schema validators (Zod, Valibot, etc.) with zero ArkType in the bundle.
- **`arkenv/core`**: Mode-agnostic primitives - `ArkEnvError` and `ValidationIssue`.

**For Standard Schema users** (Zod, Valibot, etc.), import from `arkenv/standard` directly, without passing `{ validator: "standard" }` on every call:

```ts
// ❌ Before
import arkenv from "arkenv";
import { z } from "zod";

const env = arkenv(
  { PORT: z.coerce.number() },
  { validator: "standard" },
);

// ✅ After
import arkenv from "arkenv/standard";
import { z } from "zod";

const env = arkenv({ PORT: z.coerce.number() });
```

**For `arkenv/arktype` users**, the `type` helper has moved to the main entry:

```ts
// ❌ Before
import { type } from "arkenv/arktype";

// ✅ After
import { type } from "arkenv"; // 'type' is the ArkEnv helper, not a TS type modifier
```
