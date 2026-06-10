---
"arkenv": patch
---

#### Add `emptyAsUndefined` option to treat empty env values as missing

Add a new `emptyAsUndefined` configuration option to both `createEnv` (ArkType mode) and `arkenv/standard` (Standard Schema mode). When enabled, environment variables set to empty strings (e.g., `PORT=` in a `.env` file) are treated as if they were missing, allowing defaults to apply and preventing unnecessary validation errors for numeric, boolean, or array types.

**Usage:**

```ts
import arkenv from "arkenv";

const env = arkenv(
  { PORT: "number = 3000", DEBUG: "boolean = false" },
  { emptyAsUndefined: true }
);

// Given PORT= and DEBUG= in the environment:
// env.PORT  → 3000
// env.DEBUG → false
```

```ts
import arkenv from "arkenv/standard";
import { z } from "zod";

const env = arkenv(
  { PORT: z.coerce.number().default(3000) },
  { emptyAsUndefined: true }
);
```

- The default behavior remains unchanged (`emptyAsUndefined: false`).
- Keys with empty values are removed from the input record before validation so that ArkType defaults and optional types work correctly.
