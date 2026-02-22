---
"arkenv": minor
"@arkenv/vite-plugin": patch
---

#### `arkenv/standard` import

`arkenv` now ships three separate entry points:

- **`arkenv`** (main): ArkType-first. Includes `createEnv` (aliased to `arkenv` default import), `type`, and `ArkEnvError`. Importing from this entry requires you to have ArkType installed.
- **`arkenv/standard`**: ArkType-free. A standalone `createEnv` (aliased to `arkenv` default import) for Standard Schema validators (Zod, Valibot, etc.), not requiring ArkType.
- **`arkenv/core`**: Mode-agnostic primitives - `ArkEnvError` and `ValidationIssue`.

#### Breaking changes

**1. `validator: "standard"` option removed; `arkenv` now statically requires ArkType.**
The `validator` config option has been removed - ArkType is now always required when importing from `arkenv`. For a zero-ArkType bundle, use `arkenv/standard`:

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

**2. `type` moved from `arkenv/arktype` to `arkenv`.**
The `type` helper is now exported from the main entry. The `arkenv/arktype` sub-path is no longer public:

```ts
// ❌ Before
import { type } from "arkenv/arktype";

// ✅ After
import { type } from "arkenv"; // 'type' is the ArkEnv helper, not a TS type modifier
```
