---
"arkenv": minor
---

#### ArkType is now an optional peer dependency

To achieve a true zero-dependency core, ArkType is now an optional peer dependency.

- **Breaking Change**: The `type` export has been moved from the main `arkenv` entry point to `arkenv/arktype`.

```ts
// ❌ Before
import { type } from "arkenv";

// ✅ After
import { type } from "arkenv/arktype";
```

- **Explicit Validator Modes**: ArkEnv now supports an explicit `validator` option.

  - **`validator: "arktype"` (default)**: Uses ArkType for validation and coercion. Requires `arktype` to be installed.
  - **`validator: "standard"`**: Uses Standard Schema validators directly (e.g., Zod, Valibot). Works without ArkType.

Existing usage of `arkenv()` remains unchanged when ArkType is installed. Projects using ArkType features must now explicitly install `arktype` and import helpers from `arkenv/arktype`.
