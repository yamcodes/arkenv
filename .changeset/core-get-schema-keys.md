---
"arkenv": patch
---

#### Centralize schema key extraction and update RuntimeEnvironment type

Centralize the schema-key extraction logic `getSchemaKeys` inside the core `arkenv` package. This removes the need for individual framework adapters (such as Next.js and Nuxt) to duplicate this logic, ensuring that schema shape inspection remains consistent and lightweight.

Additionally, update the `RuntimeEnvironment` type from `Dict<string>` to `Record<string, unknown>` to allow framework adapters to pass un-coerced runtime values (e.g., pre-parsed numbers or booleans from Nuxt's `runtimeConfig`) directly to the core `createEnv` validator, delegating coercion and validation entirely to the core validator.

##### Internal Code Export

```ts
import { getSchemaKeys } from "arkenv";

// Extract keys from any Standard Schema or ArkType schema
const keys = getSchemaKeys(mySchema);
```
