---
"arkenv": minor
---

Rename `defineEnv` to `createEnv`

The main API for building a validated env object is now `createEnv`.

**Before**
```ts
import { defineEnv } from "arkenv";

const env = defineEnv({
  NODE_ENV: "'development' | 'production' | 'test'",
});
```

**After**

```ts
import { createEnv } from "arkenv";

const env = createEnv({
  NODE_ENV: "'development' | 'production' | 'test'",
});
```

This aligns better with the actual behavior: ArkEnv creates, validates, and returns a typesafe env object.

BREAKING CHANGE: `defineEnv` has been removed in favor of `createEnv`.