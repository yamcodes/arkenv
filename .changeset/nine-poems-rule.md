---
"arkenv": minor
"@arkenv/vite-plugin": patch
---

#### Refactor export surface into three tiers

`arkenv` now ships three dedicated entry points:

- **`arkenv`** (main): ArkType-first. Includes `createEnv`, `type`, and `ArkEnvError`. The `type` helper, previously at `arkenv/arktype`, has moved here.
- **`arkenv/standard`**: ArkType-free. A standalone `createEnv` for Standard Schema validators (Zod, Valibot, etc.) with zero ArkType in the bundle.
- **`arkenv/core`**: Mode-agnostic primitives - `ArkEnvError` and `ValidationIssue`.

The `arkenv/arktype` sub-path has been removed. Update imports:

```ts
// ❌ Before
import { type } from "arkenv/arktype";

// ✅ After
import { type } from "arkenv";
```
